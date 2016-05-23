# Set an output prefix, which is the local directory if not specified
PREFIX?=$(shell pwd)
BUILDTAGS=

.PHONY: clean all dbuild run fmt vet lint build test install static
.DEFAULT: default

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
	docker build --rm --force-rm -t r.j3ss.co/contained .

dind:
	docker build --rm --force-rm -f Dockerfile.dind -t docker:userns .
	docker run -d \
		--name dind \
		--privileged \
		-p 1234:10000 \
		docker:userns \
		docker daemon -D --storage-driver overlay \
		-H tcp://127.0.0.1:2375 \
		--host=unix:///var/run/docker.sock \
		--disable-legacy-registry=true \
		--userns-remap default \
		--exec-opt=native.cgroupdriver=cgroupfs

run: dbuild
	docker run --rm -it \
		-v $(CURDIR):/usr/src/seccomp-term \
		--net container:dind \
		r.j3ss.co/contained -d
