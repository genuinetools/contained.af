
var Server = require('./server.js')

module.exports = require('./stream.js')
module.exports.Server = Server
module.exports.createServer = Server
