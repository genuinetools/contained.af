FROM mhart/alpine-node:5

RUN apk add --no-cache \
	bash \
	build-base \
	curl \
	e2fsprogs \
	e2fsprogs-extra \
	iptables \
	make \
	python \
	tar \
	xz

ENV DOCKER_BUCKET get.docker.com
ENV DOCKER_VERSION 1.11.0
ENV DOCKER_SHA256 87331b3b75d32d3de5d507db9a19a24dd30ff9b2eb6a5a9bdfaba954da15e16b

RUN set -x \
	&& curl -fSL "https://${DOCKER_BUCKET}/builds/Linux/x86_64/docker-$DOCKER_VERSION.tgz" -o docker.tgz \
	&& echo "${DOCKER_SHA256} *docker.tgz" | sha256sum -c - \
	&& tar -xzvf docker.tgz \
	&& mv docker/* /usr/local/bin/ \
	&& rmdir docker \
	&& rm docker.tgz \
	&& docker -v

WORKDIR /usr/src/seccomp-term

COPY package.json /usr/src/seccomp-term/

RUN npm install

COPY . /usr/src/seccomp-term/

#CMD ["node", "app.js"]
CMD ["bash"]
