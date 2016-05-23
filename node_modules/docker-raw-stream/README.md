# docker-raw-stream

Decode/encode a docker raw stream

```
npm install docker-raw-stream
```

[![build status](http://img.shields.io/travis/mafintosh/docker-raw-stream.svg?style=flat)](http://travis-ci.org/mafintosh/docker-raw-stream)

## Usage

docker raw streams multiplexes stdout/stderr to a single stream

``` js
var raw = require('docker-raw-stream')
var request = require('request')

var decode = raw.decode()

// forward the output to stdio
decode.stdout.pipe(process.stdout)
decode.stderr.pipe(process.stderr)

var url = 'http://docker-host:2375/containers/f7f65a63a595/attach?stderr=1&stdout=1&stream=1'
request.post(url).pipe(decode)
```

You can also use it encode a stream to the docker raw stream format

``` js
var encode = raw.encode()

// forward stdin to the stdout channel
process.stdin.pipe(encode.stdout)

encode.pipe(someWritableStream)
```

Per default if you end either `encode.stdout` or `encode.stderr` the encode stream will end.
If you want to have the encode stream be half open use `raw.encode({halfOpen:true})`.
This will require both `encode.stdout` and `encode.stderr` to end before the encode stream ends.

## License

MIT