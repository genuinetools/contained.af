package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/strslice"
	"github.com/gorilla/websocket"
	"github.com/moby/moby/client"
	"github.com/moby/moby/pkg/jsonmessage"
	"github.com/moby/moby/pkg/term"
	"github.com/sirupsen/logrus"
)

// startContainer starts a docker container and returns the container ID
// as well as a websocket connection to the attach endpoint.
func (h *handler) startContainer() (string, *websocket.Conn, error) {
	securityOpts := []string{
		"no-new-privileges",
	}
	b := bytes.NewBuffer(nil)
	if err := json.Compact(b, []byte(seccompProfile)); err != nil {
		return "", nil, fmt.Errorf("compacting json for seccomp profile failed: %v", err)
	}
	securityOpts = append(securityOpts, fmt.Sprintf("seccomp=%s", b.Bytes()))

	dropCaps := &strslice.StrSlice{"NET_RAW"}

	// create the container
	r, err := h.dcli.ContainerCreate(
		context.Background(),
		&container.Config{
			Image:        defaultDockerImage,
			Cmd:          []string{"sh"},
			Tty:          true,
			AttachStdin:  true,
			AttachStdout: true,
			AttachStderr: true,
			OpenStdin:    true,
			StdinOnce:    true,
		},
		&container.HostConfig{
			SecurityOpt: securityOpts,
			CapDrop:     *dropCaps,
			NetworkMode: "none",
			LogConfig: container.LogConfig{
				Type: "none",
			},
			Resources: container.Resources{
				PidsLimit: 5,
			},
		},
		nil, "")
	if err != nil {
		return "", nil, err
	}

	// connect to the attach websocket endpoint
	header := http.Header(make(map[string][]string))
	header.Add("Origin", h.dockerURL.String())
	v := url.Values{
		"stdin":  []string{"1"},
		"stdout": []string{"1"},
		"stderr": []string{"1"},
		"stream": []string{"1"},
	}
	wsURL := fmt.Sprintf("wss://%s/%s/containers/%s/attach/ws?%s", h.dockerURL.Host, dockerAPIVersion, r.ID, v.Encode())
	var dialer = &websocket.Dialer{
		Proxy:           http.ProxyFromEnvironment,
		TLSClientConfig: h.tlsConfig,
	}
	conn, _, err := dialer.Dial(wsURL, header)
	if err != nil {
		return r.ID, nil, fmt.Errorf("dialing %s with header %#v failed: %v", wsURL, header, err)
	}

	// start the container
	if err := h.dcli.ContainerStart(context.Background(), r.ID, types.ContainerStartOptions{}); err != nil {
		return r.ID, conn, err
	}

	return r.ID, conn, nil
}

// removeContainer removes with force a container by it's container ID.
func (h *handler) removeContainer(cid string) error {
	if err := h.dcli.ContainerRemove(context.Background(), cid,
		types.ContainerRemoveOptions{
			RemoveVolumes: true,
			Force:         true,
		}); err != nil {
		return err
	}

	logrus.Debugf("removed container: %s", cid)

	return nil
}

// pullImage requests a docker image if it doesn't exist already.
func (h *handler) pullImage(image string) error {
	exists, err := h.imageExists(image)
	if err != nil {
		return err
	}

	if exists {
		return nil
	}

	resp, err := h.dcli.ImagePull(context.Background(), image, types.ImagePullOptions{})
	if err != nil {
		return err
	}

	fd, isTerm := term.GetFdInfo(os.Stdout)

	return jsonmessage.DisplayJSONMessagesStream(resp, os.Stdout, fd, isTerm, nil)
}

// imageExists checks if a docker image exists.
func (h *handler) imageExists(image string) (bool, error) {
	_, _, err := h.dcli.ImageInspectWithRaw(context.Background(), image)
	if err == nil {
		return true, nil
	}

	if client.IsErrImageNotFound(err) {
		return false, nil
	}

	return false, err
}
