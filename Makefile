# Set an output prefix, which is the local directory if not specified
PREFIX?=$(shell pwd)
BUILDTAGS=

.PHONY: clean all dbuild run fmt vet lint build test install static

DIND_CONTAINER=contained-dind
DIND_DOCKER_IMAGE=r.j3ss.co/docker:userns
DOCKER_IMAGE=r.j3ss.co/contained


all: clean build fmt lint test vet

build:
	@echo "+ $@"
	@go build -tags "$(BUILDTAGS) cgo" -o contained .

static:
	@echo "+ $@"
	CGO_ENABLED=1 go build -tags "$(BUILDTAGS) cgo static_build" -ldflags "-w -extldflags -static" -o contained .

fmt:
	@echo "+ $@"
	@gofmt -s -l . | grep -v vendor | tee /dev/stderr

lint:
	@echo "+ $@"
	@golint ./... | grep -v vendor | tee /dev/stderr

test: fmt lint vet
	@echo "+ $@"
	@go test -v -tags "$(BUILDTAGS) cgo" $(shell go list ./... | grep -v vendor)

vet:
	@echo "+ $@"
	@go vet $(shell go list ./... | grep -v vendor)

clean:
	@echo "+ $@"
	@rm -rf contained

dbuild:
	docker build --rm --force-rm -t $(DOCKER_IMAGE) .

dind:
	docker build --rm --force-rm -f Dockerfile.dind -t $(DIND_DOCKER_IMAGE) .
	docker run -d \
		--name $(DIND_CONTAINER) \
		--privileged \
		-p 1234:10000 \
		$(DIND_DOCKER_IMAGE) \
		docker daemon -D --storage-driver overlay \
		-H tcp://127.0.0.1:2375 \
		--host=unix:///var/run/docker.sock \
		--disable-legacy-registry=true \
		--userns-remap default \
		--log-driver=none \
		--exec-opt=native.cgroupdriver=cgroupfs

run: dbuild
	docker run --rm -it \
		--net container:$(DIND_CONTAINER) \
		$(DOCKER_IMAGE) -d
