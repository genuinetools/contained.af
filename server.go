package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/url"

	"github.com/Sirupsen/logrus"
	"github.com/docker/engine-api/client"
	"github.com/docker/engine-api/types"
	"github.com/docker/engine-api/types/container"
	"github.com/docker/engine-api/types/strslice"

	"golang.org/x/net/context"
	"golang.org/x/net/websocket"
)

const (
	dockerAPIVersion = "v1.23"
)

type handler struct {
	dcli      *client.Client
	dockerURL *url.URL
}

type message struct {
	Type   string `json:"type"`
	Data   string `json:"data"`
	Height int    `json:"height,omitempty"`
	Width  int    `json:"width,omitempty"`
}

func (h *handler) termServer(ws *websocket.Conn) {
	// start the container
	cid, attachWS, err := h.startContainer()
	if err != nil {
		logrus.Errorf("starting container failed: %v", err)
	}
	logrus.Debugf("container started with id: %s", cid)

	isOpen := true

	go func() {
		for isOpen {
			var data message
			if err := websocket.JSON.Receive(ws, &data); err != nil {
				isOpen = false
				logrus.Warnf("Receiver Closing: %v", err)
				// cleanup and remove the container
				if err := h.removeContainer(cid); err != nil {
					logrus.Errorf("removing container %s failed: %v", cid, err)
				}
				break
			}
			logrus.Debugf("Recieved from browser: %#v", data)

			// send to attach websocket or resize
			switch data.Type {
			case "stdin":
				if _, err := attachWS.Write([]byte(data.Data)); err != nil {
					logrus.Errorf("writing to attach websocket failed: %v", err)
				}
				logrus.Debugf("Wrote to attach websocket: %s", data.Data)
			case "resize":
				if err := h.dcli.ContainerResize(context.Background(), cid, types.ResizeOptions{
					Height: data.Height,
					Width:  data.Width,
				}); err != nil {
					logrus.Errorf("resize container to height -> %d, width: %d failed: %v", data.Height, data.Width, err)
				}
			case "run":
				if err := h.dcli.ContainerResize(context.Background(), cid, types.ResizeOptions{
					Height: data.Height,
					Width:  data.Width,
				}); err != nil {
					logrus.Errorf("resize container to height -> %d, width: %d failed: %v", data.Height, data.Width, err)
				}
			default:
				logrus.Warnf("got unknown data type: %s", data.Type)
			}
		}
	}()

	// Start a go routine to listen
	for isOpen {
		var msg = make([]byte, 512)
		var n int
		n, err = attachWS.Read(msg)
		if err != nil {
			// TODO (jess): don't log if EOF jfc
			logrus.Errorf("reading from attach websocket failed: %v", err)
			continue
		}
		logrus.Infof("Received from attach websocket: %s", string(msg[:n]))

		// send it back through to the browser client as a binary frame
		b := message{
			Type: "stdout",
			Data: string(msg[:n]),
		}
		if err := websocket.JSON.Send(ws, b); err != nil {
			isOpen = false
			logrus.Debugf("Sender Closing: %v", err)
			break
		}
		logrus.Debugf("Sent message back to client: %#v", b)
	}

	// cleanup and remove the container
	if err := h.removeContainer(cid); err != nil {
		logrus.Errorf("removing container %s failed: %v", cid, err)
	}
}

func (h *handler) startContainer() (string, *websocket.Conn, error) {
	securityOpts := []string{"no-new-privileges"}
	b := bytes.NewBuffer(nil)
	if err := json.Compact(b, []byte(seccompProfile)); err != nil {
		return "", nil, fmt.Errorf("compacting json for seccomp profile failed: %v", err)
	}
	securityOpts = append(securityOpts, fmt.Sprintf("seccomp=%s", b.Bytes()))

	// create the container
	r, err := h.dcli.ContainerCreate(
		context.Background(),
		&container.Config{
			Image:        "alpine:latest",
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
			CapDrop:     strslice.StrSlice{"NET_RAW"},
		},
		nil, "")
	if err != nil {
		return "", nil, err
	}

	// connect to the attach websocket endpoint
	origin := h.dockerURL.String()
	wsURL := fmt.Sprintf("ws://%s/%s/containers/%s/attach/ws?logs=1&stderr=1&stdout=1&stream=1&stdin=1", h.dockerURL.Host, dockerAPIVersion, r.ID)
	attachWS, err := websocket.Dial(wsURL, "", origin)
	if err != nil {
		return r.ID, nil, fmt.Errorf("dialing %s with origin %s failed: %v", wsURL, origin, err)
	}

	// start the container
	if err := h.dcli.ContainerStart(context.Background(), r.ID, ""); err != nil {
		return r.ID, attachWS, err
	}

	return r.ID, attachWS, nil
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
