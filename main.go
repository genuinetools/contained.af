package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"flag"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"

	"github.com/docker/docker/client"
	"github.com/genuinetools/contained.af/version"
	"github.com/genuinetools/pkg/cli"
	"github.com/sirupsen/logrus"
)

const (
	defaultStaticDir   = "/usr/src/contained.af"
	defaultDockerHost  = "http://127.0.0.1:2375"
	defaultDockerImage = "alpine:latest"
)

var (
	dockerHost   string
	dockerCACert string
	dockerCert   string
	dockerKey    string

	staticDir string
	port      string

	debug bool
)

func main() {
	// Create a new cli program.
	p := cli.NewProgram()
	p.Name = "contained.af"
	p.Description = "A game for learning about containers, capabilities, and syscalls"

	// Set the GitCommit and Version.
	p.GitCommit = version.GITCOMMIT
	p.Version = version.VERSION

	// Setup the global flags.
	p.FlagSet = flag.NewFlagSet("global", flag.ExitOnError)
	p.FlagSet.StringVar(&dockerHost, "dhost", defaultDockerHost, "host to commmunicate with docker on")
	p.FlagSet.StringVar(&dockerCACert, "dcacert", "", "trust certs signed only by this CA for docker host")
	p.FlagSet.StringVar(&dockerCert, "dcert", "", "path to TLS certificate file for docker host")
	p.FlagSet.StringVar(&dockerKey, "dkey", "", "path to TLS key file for docker host")

	p.FlagSet.StringVar(&staticDir, "frontend", defaultStaticDir, "directory that holds the static frontend files")
	p.FlagSet.StringVar(&port, "port", "10000", "port for server")

	p.FlagSet.BoolVar(&debug, "d", false, "enable debug logging")

	// Set the before function.
	p.Before = func(ctx context.Context) error {
		// Set the log level.
		if debug {
			logrus.SetLevel(logrus.DebugLevel)
		}

		return nil
	}

	// Set the main program action.
	p.Action = func(ctx context.Context, args []string) error {
		dockerURL, err := url.Parse(dockerHost)
		if err != nil {
			logrus.Fatal(err)
		}

		// setup client TLS
		tlsConfig := tls.Config{
			// Prefer TLS1.2 as the client minimum
			MinVersion: tls.VersionTLS12,
			CipherSuites: []uint16{
				tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
				tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
			},
			InsecureSkipVerify: false,
		}

		if dockerCACert != "" {
			CAs, err := certPool(dockerCACert)
			if err != nil {
				logrus.Fatal(err)
			}
			tlsConfig.RootCAs = CAs
		}

		c := &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: &tlsConfig,
			},
		}

		if dockerCert != "" && dockerKey != "" {
			tlsCert, err := tls.LoadX509KeyPair(dockerCert, dockerKey)
			if err != nil {
				logrus.Fatalf("Could not load X509 key pair: %v. Make sure the key is not encrypted", err)
			}
			tlsConfig.Certificates = []tls.Certificate{tlsCert}
		}

		defaultHeaders := map[string]string{"User-Agent": "engine-api-cli-1.0"}
		dcli, err := client.NewClient(dockerHost, "", c, defaultHeaders)
		if err != nil {
			logrus.Fatal(err)
		}

		h := &handler{
			dcli:      dcli,
			dockerURL: dockerURL,
			tlsConfig: &tlsConfig,
		}

		// pull alpine image if we don't already have it
		if err := h.pullImage(defaultDockerImage); err != nil {
			logrus.Fatalf("pulling %s failed: %v", defaultDockerImage, err)
		}

		// websocket handler
		http.HandleFunc("/term", h.websocketHandler)

		// ping handler
		http.HandleFunc("/ping", pingHandler)

		// info handler
		http.HandleFunc("/info", h.infoHandler)

		// static files
		http.Handle("/", http.FileServer(http.Dir(staticDir)))

		logrus.Debugf("Server listening on %s", port)
		if err := http.ListenAndServe(":"+port, nil); err != nil {
			logrus.Fatalf("starting server failed: %v", err)
		}
		return nil
	}

	// Run our program.
	p.Run()
}

// certPool returns an X.509 certificate pool from `caFile`, the certificate file.
func certPool(caFile string) (*x509.CertPool, error) {
	// If we should verify the server, we need to load a trusted ca
	certPool := x509.NewCertPool()
	pem, err := ioutil.ReadFile(caFile)
	if err != nil {
		return nil, fmt.Errorf("could not read CA certificate %q: %v", caFile, err)
	}
	if !certPool.AppendCertsFromPEM(pem) {
		return nil, fmt.Errorf("failed to append certificates from PEM file: %q", caFile)
	}
	s := certPool.Subjects()
	subjects := make([]string, len(s))
	for i, subject := range s {
		subjects[i] = string(subject)
	}
	logrus.Debugf("Trusting certs with subjects: %v", subjects)
	return certPool, nil
}
