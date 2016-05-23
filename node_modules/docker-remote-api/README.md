# docker-remote-api

Basic http wrapper to call the docker remote api from node

```
npm install docker-remote-api
```

[![build status](http://img.shields.io/travis/mafintosh/docker-remote-api.svg?style=flat)](http://travis-ci.org/mafintosh/docker-remote-api)

## Usage

``` js
var docker = require('docker-remote-api')
var request = docker({
  host: '/var/run/docker.sock'
})

request.get('/images/json', {json:true}, function(err, images) {
  if (err) throw err
  console.log('images', images)
})

request.get('/images/json', function(err, stream) {
  if (err) throw err
  // stream is a raw response stream
})
```

## API

#### `request = docker(options)`

`options.host` should be an address to a docker instance i.e. `/var/run/docker.sock` or `127.0.0.1:2375`.
All other options will be used as default values for `get`, `post`, `put`, `delete`.

If you omit the `options.host` it will be set to `$DOCKER_HOST` or `/var/run/docker.sock`

#### `request.get(path, [options], cb)`

Send a `GET` request to the remote api. `path` should be the request path i.e. `/images/json`.
`options` can contain the following

``` js
{
  qs: {foo:'bar'},        // set querystring parameters
  headers: {name: '...'}, // set request headers
  json: true,             // return json instead of a stream
  buffer: true,           // return a buffer instead of a stream
  drain: true,            // will drain the response stream before calling cb
  timeout: 20000,         // set request timeout
  version: 'v1.14'        // set explicit api version
}
```

#### `request.delete(path, [options], cb)`

Send a `DELETE` request. Similar options as `request.get`

#### `post = request.post(path, [options], cb)`

Send a `POST` request. Similar options as `request.get` except it returns a request stream
that you can pipe a request body to. If you are sending json you can set `options.json = body`
and `body` will be stringified and sent as the request body.

If you do not have a request body set `body: null` or remember to call `post.end()`

#### `put = request.put(path, [options], cb)`

Send a `PUT` request. Similar options as `request.put`

## License

MIT