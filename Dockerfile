FROM golang:alpine as builder
MAINTAINER Jessica Frazelle <jess@linux.com>

ENV PATH /go/bin:/usr/local/go/bin:$PATH
ENV GOPATH /go

RUN	apk add --no-cache \
	bash \
	ca-certificates

COPY . /go/src/github.com/genuinetools/contained.af

RUN set -x \
	&& apk add --no-cache --virtual .build-deps \
		git \
		gcc \
		libc-dev \
		libgcc \
		make \
	&& cd /go/src/github.com/genuinetools/contained.af \
	&& make static \
	&& mv contained.af /usr/bin/contained.af \
	&& apk del .build-deps \
	&& rm -rf /go \
	&& echo "Build complete."

FROM alpine:latest

COPY --from=builder /usr/bin/contained.af /usr/bin/contained.af
COPY --from=builder /etc/ssl/certs/ /etc/ssl/certs

COPY frontend /usr/src/contained.af/
WORKDIR /usr/src/contained.af

ENTRYPOINT [ "contained.af" ]
CMD [ "--help" ]
