FROM docker:dind

RUN apk add --no-cache \
	bash \
	openssl

COPY config /etc/docker/daemon/config
WORKDIR /etc/docker/daemon/config

ENTRYPOINT ["./setup_certs.sh"]
