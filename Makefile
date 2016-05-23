.PHONY: build run

all: build run

build:
	docker build --rm --force-rm -t jess/seccomp-term .

dind:
	docker run -d \
		--name dind \
		--privileged \
		-p 1234:8080 \
		docker:dind \
		docker daemon -D --storage-driver overlay \
		-H tcp://127.0.0.1:2375 \
		--host=unix:///var/run/docker.sock \
		--disable-legacy-registry=true \
		--exec-opt=native.cgroupdriver=cgroupfs

run: build
	docker run --rm -it \
		-v $(CURDIR):/usr/src/seccomp-term \
		--net container:dind \
		jess/seccomp-term
