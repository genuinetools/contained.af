FROM golang:alpine as builder
MAINTAINER Jessica Frazelle <jess@linux.com>

ENV PATH /go/bin:/usr/local/go/bin:$PATH
ENV GOPATH /go

RUN	apk add --no-cache \
	ca-certificates

COPY . /go/src/github.com/jessfraz/contained

RUN set -x \
	&& apk add --no-cache --virtual .build-deps \
		git \
		gcc \
		libc-dev \
		libgcc \
		make \
	&& cd /go/src/github.com/jessfraz/contained \
	&& make static \
	&& mv contained /usr/bin/contained \
	&& apk del .build-deps \
	&& rm -rf /go \
	&& echo "Build complete."

FROM scratch

COPY --from=builder /usr/bin/contained /usr/bin/contained
COPY --from=builder /etc/ssl/certs/ /etc/ssl/certs

COPY static /usr/src/contained/
WORKDIR /usr/src/contained

ENTRYPOINT [ "contained" ]
CMD [ "--help" ]
