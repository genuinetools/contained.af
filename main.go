package main

import (
	"flag"
	"fmt"
	"net/http"
	"net/url"
	"os"

	"golang.org/x/net/websocket"

	"github.com/Sirupsen/logrus"
	"github.com/docker/engine-api/client"
)

const (
	// BANNER is what is printed for help/info output
	BANNER = `contained
 Version: %s
`
	// VERSION is the binary version.
	VERSION = "v0.1.0"

	defaultStaticDir  = "/usr/src/contained"
	defaultDockerHost = "http://127.0.0.1:2375"
)

var (
	dockerHost string
	dockerCert string
	dockerKey  string

	staticDir string
	port      string

	debug   bool
	version bool
)

func init() {
	// Parse flags
	flag.StringVar(&dockerHost, "dhost", defaultDockerHost, "host to commmunicate with docker on")
	flag.StringVar(&dockerCert, "dcert", "", "path to ssl certificate for docker host")
	flag.StringVar(&dockerKey, "dkey", "", "path to ssl key for docker host")

	flag.StringVar(&staticDir, "static", defaultStaticDir, "directory that holds the static files")
	flag.StringVar(&port, "port", "10000", "port for server")

	flag.BoolVar(&version, "version", false, "print version and exit")
	flag.BoolVar(&version, "v", false, "print version and exit (shorthand)")
	flag.BoolVar(&debug, "d", false, "run in debug mode")

	flag.Usage = func() {
		fmt.Fprint(os.Stderr, fmt.Sprintf(BANNER, VERSION))
		flag.PrintDefaults()
	}

	flag.Parse()

	if version {
		fmt.Printf("%s", VERSION)
		os.Exit(0)
	}

	// Set log level
	if debug {
		logrus.SetLevel(logrus.DebugLevel)
	}
}

func main() {
	dockerURL, err := url.Parse(dockerHost)
	if err != nil {
		logrus.Fatal(err)
	}

	defaultHeaders := map[string]string{"User-Agent": "engine-api-cli-1.0"}
	dcli, err := client.NewClient(dockerHost, "", nil, defaultHeaders)
	if err != nil {
		logrus.Fatal(err)
	}

	h := &handler{
		dcli:      dcli,
		dockerURL: dockerURL,
	}

	// websocket handler
	http.Handle("/term", websocket.Handler(h.termServer))

	// static files
	http.Handle("/", http.FileServer(http.Dir(staticDir)))

	logrus.Debugf("Server listening on %s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		logrus.Fatalf("starting server failed: %v", err)
	}
}

func usageAndExit(message string, exitCode int) {
	if message != "" {
		fmt.Fprintf(os.Stderr, message)
		fmt.Fprintf(os.Stderr, "\n\n")
	}
	flag.Usage()
	fmt.Fprintf(os.Stderr, "\n")
	os.Exit(exitCode)
}
