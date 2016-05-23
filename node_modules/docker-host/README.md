# docker-host

Tiny module that parses docker remote host (usually `$DOCKER_HOST`)

```
npm install docker-host
```

[![build status](http://img.shields.io/travis/mafintosh/docker-host.svg?style=flat)](http://travis-ci.org/mafintosh/docker-host)

## Usage

``` js
var host = require('docker-host')

var h = host()
console.log(h) // will print something like {socketPath:'/var/run/docker.sock'}
               // if $DOCKER_HOST is set that will be used as foundation as well

var h = host('tcp://:2375')
console.log(h) // will print {host:'localhost', port:2375}
```

## License

MIT