# Set an output prefix, which is the local directory if not specified
PREFIX?=$(shell pwd)

# Setup name variables for the package/tool
NAME := contained
PKG := github.com/jessfraz/$(NAME)

DIND_CONTAINER=$(NAME)-dind
DIND_DOCKER_IMAGE=r.j3ss.co/docker:userns
DOCKER_IMAGE=r.j3ss.co/$(NAME)

# Set any default go build tags
BUILDTAGS :=

# Set the build dir, where built cross-compiled binaries will be output
BUILDDIR := ${PREFIX}/cross

# Populate version variables
# Add to compile time flags
VERSION := $(shell cat VERSION)
GITCOMMIT := $(shell git rev-parse --short HEAD)
GITUNTRACKEDCHANGES := $(shell git status --porcelain --untracked-files=no)
ifneq ($(GITUNTRACKEDCHANGES),)
	GITCOMMIT := $(GITCOMMIT)-dirty
endif
CTIMEVAR=-X $(PKG)/version.GITCOMMIT=$(GITCOMMIT) -X $(PKG)/version.VERSION=$(VERSION)
GO_LDFLAGS=-ldflags "-w $(CTIMEVAR)"
GO_LDFLAGS_STATIC=-ldflags "-w $(CTIMEVAR) -extldflags -static"

# List the GOOS and GOARCH to build
GOOSARCHES = darwin/amd64 darwin/386 freebsd/amd64 freebsd/386 linux/arm linux/arm64 linux/amd64 linux/386 solaris/amd64 windows/amd64 windows/386

all: clean build fmt lint test staticcheck vet install ## Runs a clean, build, fmt, lint, test, staticcheck, vet and install

.PHONY: build
build: $(NAME) ## Builds a dynamic executable or package

$(NAME): *.go VERSION
	@echo "+ $@"
	go build -tags "$(BUILDTAGS)" ${GO_LDFLAGS} -o $(NAME) .

.PHONY: static
static: ## Builds a static executable
	@echo "+ $@"
	CGO_ENABLED=0 go build \
				-tags "$(BUILDTAGS) static_build" \
				${GO_LDFLAGS_STATIC} -o $(NAME) .

.PHONY: fmt
fmt: ## Verifies all files have men `gofmt`ed
	@echo "+ $@"
	@gofmt -s -l . | grep -v '.pb.go:' | grep -v vendor | tee /dev/stderr

.PHONY: lint
lint: ## Verifies `golint` passes
	@echo "+ $@"
	@golint ./... | grep -v '.pb.go:' | grep -v vendor | tee /dev/stderr

.PHONY: test
test: ## Runs the go tests
	@echo "+ $@"
	@go test -v -tags "$(BUILDTAGS) cgo" $(shell go list ./... | grep -v vendor)

.PHONY: vet
vet: ## Verifies `go vet` passes
	@echo "+ $@"
	@go vet $(shell go list ./... | grep -v vendor) | grep -v '.pb.go:' | tee /dev/stderr

.PHONY: staticcheck
staticcheck: ## Verifies `staticcheck` passes
	@echo "+ $@"
	@staticcheck $(shell go list ./... | grep -v vendor) | grep -v '.pb.go:' | tee /dev/stderr

.PHONY: install
install: ## Installs the executable or package
	@echo "+ $@"
	@go install .

# set the graph driver as the current graphdriver if not set
DOCKER_GRAPHDRIVER := $(if $(DOCKER_GRAPHDRIVER),$(DOCKER_GRAPHDRIVER),$(shell docker info 2>&1 | grep "Storage Driver" | sed 's/.*: //'))
.PHONY: dind
dind: ## Starts a docker-in-docker container to be used with a local server
	docker build --rm --force-rm -f Dockerfile.dind -t $(DIND_DOCKER_IMAGE) .
	docker run -d  \
		--tmpfs /var/lib/docker \
		--name $(DIND_CONTAINER) \
		--privileged \
		-p 10000:10000 \
		-v $(CURDIR)/.certs:/etc/docker/ssl \
		$(DIND_DOCKER_IMAGE) \
		dockerd -D --storage-driver $(DOCKER_GRAPHDRIVER) \
		-H tcp://127.0.0.1:2375 \
		--host=unix:///var/run/docker.sock \
		--disable-legacy-registry=true \
		--userns-remap default \
		--log-driver=none \
		--exec-opt=native.cgroupdriver=cgroupfs \
		--ip-forward=false \
		--ip-masq=false \
		--icc=false \
		--tlsverify \
		--tlscacert=/etc/docker/ssl/cacert.pem \
		--tlskey=/etc/docker/ssl/server.key \
		--tlscert=/etc/docker/ssl/server.cert

.PHONY: dbuild
dbuild:
	docker build --rm --force-rm -t $(DOCKER_IMAGE) .

.PHONY: run
run: dbuild ## Run the server locally in a docker container
	docker run --rm -it \
		-v $(CURDIR)/.certs:/etc/docker/ssl:ro \
		--net container:$(DIND_CONTAINER) \
		$(DOCKER_IMAGE) -d \
		--dcacert=/etc/docker/ssl/cacert.pem \
		--dcert=/etc/docker/ssl/client.cert \
		--dkey=/etc/docker/ssl/client.key

.PHONY: devbuild
devbuild:
	docker build --rm --force-rm -f Dockerfile.dev -t $(DOCKER_IMAGE):dev .

static/js/contained.min.js: devbuild
	docker run --rm -it \
		-v $(CURDIR)/:/usr/src/contained.af \
		--workdir /usr/src/contained.af \
		$(DOCKER_IMAGE):dev \
		uglifyjs --output $@ --compress --mangle -- \
			static/js/xterm.js \
			static/js/fit.js \
			static/js/jquery-2.2.4.min.js \
			static/js/questions.js \
			static/js/main.js

static/css/contained.min.css: devbuild
	docker run --rm -it \
		-v $(CURDIR)/:/usr/src/contained.af \
		--workdir /usr/src/contained.af \
		$(DOCKER_IMAGE):dev \
		sh -c 'cat static/css/normalize.css static/css/bootstrap.min.css static/css/xterm.css static/css/custom.css | cleancss -o $@'

.PHONY: dev
dev: static/js/contained.min.js static/css/contained.min.css ## Build the static components

.PHONY: clean
clean: ## Cleanup any build binaries or packages
	@echo "+ $@"
	$(RM) $(NAME)
	$(RM) -r $(CURDIR)/.certs

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
