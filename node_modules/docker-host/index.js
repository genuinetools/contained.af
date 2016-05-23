module.exports = function(remote) {
  if (!remote) remote = process.env.DOCKER_HOST || 'unix:///var/run/docker.sock'
  if (typeof remote === 'number') return {host:'localhost', port:remote}
  if (remote.indexOf('://') === -1) remote = 'tcp://'+remote

  var parts = remote.match(/^(.+):\/\/([^:]*)(?::(\d+))?$/)
  if (!parts) throw new Error('Invalid docker remote: '+remote)

  var protocol = parts[1]
  var host = parts[2] || 'localhost'
  var port = parts[3] || 2375

  if (protocol === 'tcp') protocol = 'http'
  if (host[0] === '/') protocol = 'unix'

  if (protocol === 'unix' || protocol === 'http+unix') return {socketPath:host, host:'localhost', protocol:'http:'}
  if (host === '0.0.0.0') host = 'localhost'
  return {host:host, port:parseInt(port, 10), protocol:protocol+':'}
}
