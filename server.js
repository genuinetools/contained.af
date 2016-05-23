var WebSocketServer = require('ws').Server
var websocket = require('websocket-stream')
var docker = require('./docker-browser-console')
var fs = require('fs')
var path = require('path')
var http = require('http')
var pump = require('pump')

var server = http.createServer()
var wss = new WebSocketServer({server:server})

wss.on('connection', function(connection) {
  var stream = websocket(connection)
  pump(stream, docker('alpine'), stream)
})

server.on('request', function(req, res) {
  fs.createReadStream(path.join(__dirname, req.url === '/bundle.js' ? 'bundle.js' : 'index.html')).pipe(res)
})

server.on('listening', function() {
  console.log('Open http://localhost:'+server.address().port+'/ in your browser')
})

server.listen(10000)
