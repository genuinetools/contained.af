var duplexify = require('duplexify')
var ndjson = require('ndjson')
var run = require('../docker-run')
var xtend = require('xtend')
var fs = require('fs')

module.exports = function(image, opts) {
  var input = ndjson.parse()
  var output = ndjson.stringify()
  var result = duplexify()

  seccompProfile = fs.readFileSync("sleep.json");
  contents = JSON.parse(seccompProfile);

  input.once('data', function(handshake) {
    if (handshake.type !== 'run') return result.destroy(new Error('Invalid handshake'))

    var child = run(image, xtend(opts, {
      host: 'http://127.0.0.1:2375',
      tty: true,
      width: handshake.width,
      height: handshake.height,
      net: 'none',
      argv: ["sh"],
      securityOpts: [
        //"seccomp="+JSON.stringify(contents),
        "no-new-privileges"
      ]
    }))

    input.on('data', function(data) {
      if (data.type === 'resize') child.resize(data.width, data.height)
      if (data.type === 'stdin') child.stdin.write(data.data)
    })

    child.stdout.on('data', function(data) {
      output.write({
        type: 'stdout',
        data: data.toString()
      })
    })

    child.stderr.on('data', function(data) {
      output.write({
        type: 'stderr',
        data: data.toString()
      })
    })

    child.on('exit', function() {
      result.destroy()
    })

    child.on('error', function(err) {
      result.destroy(err)
    })

    result.on('close', function() {
      child.kill()
    })
  })

  result.setReadable(output)
  result.setWritable(input)

  return result
}
