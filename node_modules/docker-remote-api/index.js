var host = require('docker-host')
var xtend = require('xtend')
var once = require('once')
var querystring = require('querystring')
var concat = require('concat-stream')

var noop = function() {}

var readSync = function(dir, name) {
  try {
    return require('fs').readFileSync(require('path').join(dir, name))
  } catch (err) {
    return null
  }
}

var PATH = process.env.DOCKER_CERT_PATH
var CERT = PATH && readSync(PATH, 'cert.pem')
var KEY  = PATH && readSync(PATH, 'key.pem')
var CA   = PATH && readSync(PATH, 'ca.pem')
var TLS  = process.env.DOCKER_TLS_VERIFY === '1' || process.env.DOCKER_TLS_VERIFY === 'true'

var onjson = function(req, res, cb) {
  res.pipe(concat({encoding:'buffer'}, function(buf) {
    try {
      buf = JSON.parse(buf)
    } catch (err) {
      return cb(err)
    }
    cb(null, buf)
  }))
}

var onempty = function(req, res, cb) {
  res.on('end', function() {
    cb(null, null)
  })
  res.resume()
}

var onbuffer = function(req, res, cb) {
  res.pipe(concat({encoding:'buffer'}, function(buf) {
    cb(null, buf)
  }))
}

var onstream = function(req, res, cb) {
  req.on('close', function() {
    res.emit('close')
  })
  req.on('error', function(err) {
    res.emit('error', err)
  })
  cb(null, res)
}

var onerror = function(req, res, cb) {
  res.pipe(concat({encoding:'buffer'}, function(buf) {
    var err = new Error(buf.toString().trim() || 'Bad status code: '+res.statusCode)
    err.status = res.statusCode
    cb(err)
  }))
}

var destroyer = function(req) {
  return function() {
    req.destroy()
  }
}

var API = function(opts) {
  if (!(this instanceof API)) return new API(opts)
  if (typeof opts === 'string' || typeof opts === 'number') opts = {host:opts}
  if (!opts) opts = {}

  this.defaults = xtend({cert:CERT, ca:CA, key:KEY, ssl:TLS}, opts, host(opts.host)) // TODO: move the defaults stuff to docker-host?
  if (this.defaults.ssl || this.defaults.tls || this.defaults.https) this.defaults.protocol = 'https:'

  this.http = (this.defaults.protocol === 'https:' ? require('https') : require('http')).request
  this.host = this.defaults.socketPath ? 'http+unix://'+this.defaults.socketPath : this.defaults.protocol+'//'+this.defaults.host+':'+this.defaults.port
}

API.prototype.type = 'docker-remote-api'

API.prototype.get = function(path, opts, cb) {
  return this.request('GET', path, opts, cb)
}

API.prototype.put = function(path, opts, cb) {
  return this.request('PUT', path, opts, cb)
}

API.prototype.post = function(path, opts, cb) {
  return this.request('POST', path, opts, cb)
}

API.prototype.head = function(path, opts, cb) {
  return this.request('HEAD', path, opts, cb)
}

API.prototype.del = API.prototype.delete = function(path, opts, cb) {
  return this.request('DELETE', path, opts, cb)
}

API.prototype.request = function(method, path, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = null
  }

  cb = once(cb || noop)
  opts = xtend(this.defaults, opts)

  if (opts.qs) path += '?'+querystring.stringify(opts.qs)
  if (opts.version) path = '/'+opts.version+path

  opts.method = method
  opts.path = path

  var headers = opts.headers
  if (headers) {
    Object.keys(headers).forEach(function(name) {
      if (typeof headers[name] === 'object' && headers[name]) headers[name] = new Buffer(JSON.stringify(headers[name])+'\n').toString('base64')
      if (!headers[name]) delete headers[name]
    })
  }

  var req = this.http(opts)

  if (opts.timeout) req.setTimeout(opts.timeout, destroyer(req))

  if (opts.json && opts.json !== true) {
    req.setHeader('Content-Type', 'application/json')
    opts.body = JSON.stringify(opts.json)
  }

  req.on('response', function(res) {
    if (res.statusCode === 304) return onempty(req, res, cb)
    else if (res.statusCode > 299) onerror(req, res, cb)
    else if (res.statusCode === 204 || opts.drain) onempty(req, res, cb)
    else if (opts.buffer) onbuffer(req, res, cb)
    else if (opts.json) onjson(req, res, cb)
    else onstream(req, res, cb)
  })

  req.on('error', cb)
  req.on('close', function() {
    cb(new Error('Premature close'))
  })

  if (method !== 'POST' && method !== 'PUT') req.end()
  else if (opts.body === null) {
    req.setHeader('Content-Length', 0)
    req.end()
  } else if (opts.body) {
    req.setHeader('Content-Length', Buffer.isBuffer(opts.body) ? opts.body.length : Buffer.byteLength(opts.body))
    req.end(opts.body)
  }

  return req
}

module.exports = API