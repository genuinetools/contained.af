package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/Sirupsen/logrus"
	"github.com/docker/engine-api/client"
	"github.com/docker/engine-api/types"

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

// pingHander returns pong.
func pingHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "pong")
}

// infoHander returns information about the connected docker daemon.
func (h *handler) infoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	info, err := h.dcli.Info(context.Background())
	if err != nil {
		logrus.Errorf("getting docker info failed: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	b, err := json.MarshalIndent(info, "", "  ")
	if err != nil {
		logrus.Errorf("marshal indent info failed: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%s", b)
}

func (h *handler) termServer(ws *websocket.Conn) {
	// start the container
	cid, attachWS, err := h.startContainer()
	if err != nil {
		logrus.Errorf("starting container failed: %v", err)
		return
	}
	logrus.Infof("container started with id: %s", cid)

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
				if len(data.Data) > 0 {
					if _, err := attachWS.Write([]byte(data.Data)); err != nil {
						logrus.Errorf("writing to attach websocket failed: %v", err)
					}
					logrus.Debugf("Wrote to attach websocket: %q", data.Data)
				}
			case "resize":
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
		// TODO: this will panic if we couldn't start the container
		n, err = attachWS.Read(msg)
		if err != nil {
			if err == io.EOF {
				continue
			}
			logrus.Errorf("reading from attach websocket failed: %v", err)
			continue
		}
		logrus.Debugf("Received from attach websocket: %s", string(msg[:n]))

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
