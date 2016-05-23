var raw = require('docker-raw-stream')
var docker = require('docker-remote-api')
var through = require('through2')
var pump = require('pump')
var events = require('events')
var debug = require('debug')('docker-run')

var noop = function() {}

var endsWith = function(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1
}

var run = function(image, opts) {
  if (!opts) opts = {}

  var request = docker(opts.host, {version:'v1.23'})
  var that = new events.EventEmitter()
  var tty = !!opts.tty

  console.log(opts.securityOpts);
  var sopts = {
    NetworkMode: opts.net === 'auto' ? (opts.ports ? 'bridge' : 'host') : opts.net,
    PortBindings: {},
    Binds: [],
    Links: [],
    SecurityOpts: opts.securityOpts,
    Privileged: !!opts.privileged
  }

  var copts = {
    AttachStdin: !opts.fork,
    AttachStdout: !opts.fork,
    AttachStderr: !opts.fork,
    OpenStdin: !opts.fork,
    StdinOnce: !opts.fork,
    Cmd: opts.argv || [],
    Tty: tty,
    Image: image,
    ExposedPorts: {},
    Env: [],
    Volumes: {}
  }

  if (opts.dns) sopts.Dns = [].concat(opts.dns)
  if (opts.entrypoint) copts.Entrypoint = [].concat(opts.entrypoint)

  if (opts.ports) {
    Object.keys(opts.ports).forEach(function(host) {
      var container = opts.ports[host]
      if (!/\//.test(container)) container += '/tcp'
      copts.ExposedPorts[container] = {}
      sopts.PortBindings[container] = [{HostPort:host+''}]
    })
  }

  if (opts.env) {
    Object.keys(opts.env).forEach(function(name) {
      copts.Env.push(name+'='+opts.env[name])
    })
  }

  if (opts.volumes) {
    Object.keys(opts.volumes).forEach(function(host) {
      var container = opts.volumes[host]
      copts.Volumes[host] = {}

      if(!endsWith(container, ':rw') || !endsWith(container, ':ro')) container += ':rw'

      sopts.Binds.push(host+':'+container)
    })
  }

  if (opts.links) {
    Object.keys(opts.links).forEach(function(name) {
      sopts.Links.push(name+':'+opts.links[name])
    })
  }
  copts.HostConfig = sopts;

  that.stdin = opts.fork ? null : through()
  that.stderr = opts.fork ? null : through()
  that.stdout = opts.fork ? null : through()
  that.setMaxListeners(0)

  var ready = function(cb) {
    if (that.id) return cb()
    that.on('spawn', cb)
  }

  that.destroy =
  that.kill = function(cb) {
    ready(function() {
      stop(that.id, remove.bind(null, that.id, cb || noop))
    })
  }

  that.resize = function(wid, hei) {
    ready(function() {
      resize(that.id, wid, hei, noop)
    })
  }

  var create = function(cb) {
    debug('creating container')
    var qs = {}
    if (opts.name) qs.name = opts.name
    request.post('/containers/create', {json: copts, qs:qs}, cb)
  }

  var attach = function(id, cb) {
    if (opts.fork) return cb()

    debug('attaching to stdio for %s', id)
    var stdin = request.post('/containers/'+id+'/attach', {
      qs: {
        stderr: 1,
        stdout: 1,
        stdin: 1,
        stream: 1
      },
      headers: {
        'Content-Length': '0'
      }
    }, function(err, response) {
      if (err) return cb(err)
      if (tty) return cb(null, stdin, response)

      var parser = response.pipe(raw())
      cb(null, stdin, parser.stdout, parser.stderr)
    })

    if (!stdin._header && stdin._implicitHeader) stdin._implicitHeader()
    if (stdin._send) stdin._send(new Buffer(0))

    stdin.on('finish', function() {
      stdin.socket.end() // force end
    })
  }

  var remove = function(id, cb) {
    if (opts.remove === false) return cb()
    debug('removing %s', id)
    request.del('/containers/'+id, cb)
  }

  var stop = function(id, cb) {
    debug('stopping %s', id)
    request.post('/containers/'+id+'/stop', {
      qs: opts.wait || 10,
      json: true,
      body: null
    }, cb)
  }

  var start = function(id, cb) {
    debug('starting %s', id)
    request.post('/containers/'+id+'/start', {json: {}}, cb)
  }

  var wait = function(id, cb) {
    debug('waiting for %s to exit', id)
    request.post('/containers/'+id+'/wait', {
      json: true,
      body: null
    }, function(err, response) {
      if (err) return cb(err)
      cb(null, response.StatusCode)
    })
  }

  var resize = function(id, wid, hei, cb) {
    debug('resizing %s to %dx%d', id, wid, hei)
    request.post('/containers/'+id+'/resize', {
      qs: {
        h: hei,
        w: wid
      },
      buffer: true,
      body: null
    }, cb)
  }

  var resizeDefault = function(id, cb) {
    if (opts.width && opts.height) return resize(id, opts.width, opts.height, cb)
    cb()
  }

  var onerror = function(id, err) {
    debug('%s crashed with error %s', id, err.message)
    remove(id, noop);
    that.emit('error', err)
  }

  create(function(err, container) {
    if (err) return onerror(null, err)

    debug('spawned %s', container.Id)
    that.id = container.Id

    attach(container.Id, function(err, stdin, stdout, stderr) {
      if (err) return onerror(container.Id, err)

      start(container.Id, function(err) {
        if (err) return onerror(container.Id, err)
        that.emit('start')

        resizeDefault(container.Id, function(err) {
          if (err) return onerror(container.Id, err)

          if (!stdin) return that.emit('spawn', that.id)

          pump(that.stdin, stdin)
          pump(stdout, that.stdout)
          if (stderr) pump(stderr, that.stderr)
          else that.stderr.end()

          wait(container.Id, function(err, code) {
            if (err) return onerror(container.Id, err)
            remove(container.Id, function() {
              that.emit('exit', code)
              that.emit('close')
            })
          })

          that.emit('spawn', that.id)
        })
      })
    })
  })

  return that
}

module.exports = run
