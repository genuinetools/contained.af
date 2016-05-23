# docker-run

Start a docker image and attach to it

```
npm install docker-run
```

[There is also a command line tool available](https://github.com/mafintosh/docker-run#command-line-usage)

## Usage

``` js
var run = require('docker-run')

var child = run('mafintosh/dev', {tty:true})

process.stdin.setRawMode(true)
process.stdin.pipe(child.stdin)
child.stdout.pipe(process.stdout)
child.stderr.pipe(process.stderr)
```

## API

* `child = run(image, [options])`

Where options can be

``` js
{
  net: 'bridge',    // network mode (auto | host | bridge). defaults to bridge
  tty: true,        // be a tty. defaults to false
  fork: true,       // fork (do not attach stdio). defaults to false
  remove: true,     // remove the container on stop. defaults to true
  dns: ['8.8.8.8'], // set custom dns servers
  ports: {
    8080: 8081      // expose container 8080 to host 8081
  },
  volumes: {
    '/root': '/tmp', // expose container /root to host /tmp
    '/root': '/tmp2:ro' // expose container /root to host /tmp2 as read only
  },
  links: {
    'container-name': 'alias' // link container-name as alias
  },
  env: {
    FOO: 'bar'      // set env vars
  },
  entrypoint: '/bin/bash' // override entrypoint on container
}
```

* `child.stdin`, `child.stderr`, `child.stdout`

The stdio streams for the container. Is `null` if `fork: true`

* `child.destroy()`

Destroy the child container

* `child.resize(wid, hei)`

Resize the container pty (if `tty: true`)

## Events

* `child.on('exit', exitCode)`

Emitted when the container exits

* `child.on('spawn', containerId)`

Emitted when the container is spawned

* `child.on('error', error)`

Emitted if the container experiences a fatal error

## Command line usage

To install the command line tool do

```
npm install -g docker-run
```

And then run

```
docker-run --help
```

To view the help. In general to run an image do

```
docker-run [image]
```

## License

MIT
