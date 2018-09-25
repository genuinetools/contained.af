# Setup name variables for the package/tool
NAME := contained.af
PKG := github.com/genuinetools/$(NAME)

CGO_ENABLED := 0

# Set any default go build tags.
BUILDTAGS :=

include basic.mk

.PHONY: prebuild
prebuild:

.PHONY: dind
dind: stop-dind ## Starts a docker-in-docker container for running the tests with.
	docker run -d  \
		--tmpfs /var/lib/docker \
		--name $(NAME)-dind \
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

.PHONY: stop-dind
stop-dind: ## Stops the docker-in-docker container.
	@docker rm -f $(NAME)-dind >/dev/null 2>&1 || true

.PHONY: run
run: dind image ## Run the server locally in a docker container.
	docker run --rm -i $(DOCKER_FLAGS) \
		-v $(CURDIR)/.certs:/etc/docker/ssl:ro \
		--net container:$(NAME)-dind \
		--disable-content-trust=true \
		$(REGISTRY)/$(NAME) -d \
		--dcacert=/etc/docker/ssl/cacert.pem \
		--dcert=/etc/docker/ssl/client.cert \
		--dkey=/etc/docker/ssl/client.key

DOCKER_FLAGS+=--rm -i \
	--disable-content-trust=true
DOCKER_FLAGS+=-v $(CURDIR):/go/src/$(PKG)
DOCKER_FLAGS+=--workdir /go/src/$(PKG)

frontend/js/contained.min.js: image-dev
	docker run $(DOCKER_FLAGS) \
		$(REGISTRY)/$(NAME):dev \
		uglifyjs --output $@ --compress --mangle -- \
			frontend/js/xterm.js \
			frontend/js/fit.js \
			frontend/js/jquery-2.2.4.min.js \
			frontend/js/questions.js \
			frontend/js/main.js

frontend/css/contained.min.css: image-dev
	docker run $(DOCKER_FLAGS) \
		$(REGISTRY)/$(NAME):dev \
		sh -c 'cat frontend/css/normalize.css frontend/css/bootstrap.min.css frontend/css/xterm.css frontend/css/custom.css | cleancss -o $@'

.PHONY: dev
dev: frontend/js/contained.min.js frontend/css/contained.min.css ## Build the frontend components.
