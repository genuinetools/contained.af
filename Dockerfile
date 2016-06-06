FROM alpine
MAINTAINER Jessica Frazelle <jess@docker.com>

ENV PATH /go/bin:/usr/local/go/bin:$PATH
ENV GOPATH /go
ENV GO15VENDOREXPERIMENT 1

RUN apk --no-cache add ca-certificates

COPY *.go /go/src/github.com/jfrazelle/contained/
COPY vendor /go/src/github.com/jfrazelle/contained/vendor

RUN set -x \
	&& apk --no-cache add --virtual build-dependencies \
		go \
		git \
		gcc \
		libc-dev \
		libgcc \
	&& cd /go/src/github.com/jfrazelle/contained \
	&& go build -o /usr/bin/contained . \
	&& apk del build-dependencies \
	&& rm -rf /go \
	&& echo "Build complete."

COPY static /usr/src/contained/
WORKDIR /usr/src/contained

ENTRYPOINT [ "contained" ]
