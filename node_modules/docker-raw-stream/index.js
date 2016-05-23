var through = require('through2')

var destroyer = function(stream, stdout, stderr) {
  var destroyed = false
  return function(err) {
    if (destroyed) return
    destroyed = true

    if (err) stream.emit('error', err)

    stdout.emit('close')
    stderr.emit('close')
    stream.emit('close')
  }
}

var decode = function() {
  var stdout = through()
  var stderr = through()
  var buffer = through()

  var size = 0
  var header = null
  var next = null

  var flush = function(cb) {
    stdout.end(function() {
      stderr.end(cb)
    })
  }

  var transform = function(data, enc, cb) {
    buffer.write(data)

    while (true) {
      if (!header) {
        header = buffer.read(8)
        if (!header) return cb()

        if (header[0] === 1) next = stdout
        else next = stderr

        size = header.readUInt32BE(4)
      }

      var chunk = buffer.read(size)
      if (!chunk) return cb()

      header = null
      next.write(chunk)
    }

    next.write(cb)
  }

  var decoder = through(transform, flush)

  decoder.stdout = stdout
  decoder.stderr = stderr
  decoder.destroy = stdout.destroy = stderr.destroy = destroyer(decoder, stdout, stderr)

  return decoder
}

var encode = function(opts) {
  if (!opts) opts = {}
  var flushes = 0

  var flush = function(cb) {
    if (++flushes === 2 || !opts.halfOpen) return encoder.end(cb)
    cb()
  }

  var transformer = function(id) {
    return function(data, enc, cb) {
      var header = new Buffer([id,0,0,0,0,0,0,0])
      header.writeUInt32BE(data.length, 4)
      encoder.write(header)
      encoder.write(data, enc, cb)
    }
  }

  var encoder = through()
  var stdout = through(transformer(1), flush)
  var stderr = through(transformer(2), flush)

  encoder.stdout = stdout
  encoder.stderr = stderr
  encoder.destroy = stdout.destroy = stderr.destroy = destroyer(encoder, stdout, stderr)

  return encoder
}

module.exports = decode
module.exports.decode = decode
module.exports.encode = encode
