FROM alpine:latest
MAINTAINER Jessica Frazelle <jess@linux.com>

ENV PATH /go/bin:/usr/local/go/bin:$PATH
ENV GOPATH /go

RUN	apk add --no-cache \
	ca-certificates

COPY . /go/src/github.com/jfrazelle/contained

RUN set -x \
	&& apk add --no-cache --virtual .build-deps \
		go \
		git \
		gcc \
		libc-dev \
		libgcc \
	&& cd /go/src/github.com/jfrazelle/contained \
	&& go build -o /usr/bin/contained . \
	&& apk del .build-deps \
	&& rm -rf /go \
	&& echo "Build complete."

COPY static /usr/src/contained/
WORKDIR /usr/src/contained

ENTRYPOINT [ "contained" ]
