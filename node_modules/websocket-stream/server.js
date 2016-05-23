
var inherits = require('inherits')
var WebSocketServer = require('ws').Server
var stream = require('./stream')

module.exports = Server

function Server(opts, cb) {
  if (!(this instanceof Server)) {
    return new Server(opts, cb)
  }

  WebSocketServer.call(this, opts)

  this.on('newListener', function(event) {
    if (event === 'stream') {
      this.on('connection', function(conn) {
        this.emit('stream', stream(conn))
      })
    }
  })

  if (cb) {
    this.on('stream', cb)
  }
}

inherits(Server, WebSocketServer)

