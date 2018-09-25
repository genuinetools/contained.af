# Setup name variables for the package/tool
NAME := contained.af
PKG := github.com/genuinetools/$(NAME)

CGO_ENABLED := 0

# Set any default go build tags.
BUILDTAGS :=

include basic.mk

.PHONY: prebuild
prebuild:

# Set the graph driver as the current graphdriver if not set.
DOCKER_GRAPHDRIVER := $(if $(DOCKER_GRAPHDRIVER),$(DOCKER_GRAPHDRIVER),$(shell docker info 2>&1 | grep "Storage Driver" | sed 's/.*: //'))
.PHONY: dind
dind: ## Starts a docker-in-docker container to be used with a local server.
	docker build --rm --force-rm -f Dockerfile.dind -t $(REGISTRY)/docker:userns .
	docker run -d  \
		--tmpfs /var/lib/docker \
		--name $(DIND_CONTAINER) \
		--privileged \
		-p 10000:10000 \
		-v $(CURDIR)/.certs:/etc/docker/ssl \
		$(REGISTRY)/docker:userns \
		dockerd -D --storage-driver $(DOCKER_GRAPHDRIVER) \
		-H tcp://127.0.0.1:2375 \
		--host=unix:///var/run/docker.sock \
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

.PHONY: run
run: image ## Run the server locally in a docker container.
	docker run --rm -it \
		-v $(CURDIR)/.certs:/etc/docker/ssl:ro \
		--net container:$(DIND_CONTAINER) \
		$(REGISTRY)/$(NAME) -d \
		--dcacert=/etc/docker/ssl/cacert.pem \
		--dcert=/etc/docker/ssl/client.cert \
		--dkey=/etc/docker/ssl/client.key

.PHONY: image-dev
image-dev:
	docker build --rm --force-rm -f Dockerfile.dev -t $(REGISTRY)/$(NAME):dev .

frontend/js/contained.min.js: image-dev
	docker run --rm -it \
		-v $(CURDIR)/:/usr/src/contained.af \
		--workdir /usr/src/contained.af \
		--disable-content-trust=true \
		$(REGISTRY)/$(NAME):dev \
		uglifyjs --output $@ --compress --mangle -- \
			frontend/js/xterm.js \
			frontend/js/fit.js \
			frontend/js/jquery-2.2.4.min.js \
			frontend/js/questions.js \
			frontend/js/main.js

frontend/css/contained.min.css: image-dev
	docker run --rm -it \
		-v $(CURDIR)/:/usr/src/contained.af \
		--workdir /usr/src/contained.af \
		--disable-content-trust=true \
		$(REGISTRY)/$(NAME):dev \
		sh -c 'cat frontend/css/normalize.css frontend/css/bootstrap.min.css frontend/css/xterm.css frontend/css/custom.css | cleancss -o $@'

.PHONY: dev
dev: frontend/js/contained.min.js frontend/css/contained.min.css ## Build the frontend components.
