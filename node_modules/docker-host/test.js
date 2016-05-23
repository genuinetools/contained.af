var tape = require('tape')
var host = require('./')

tape('basic', function(t) {
  t.same(host('localhost:2375'), {host:'localhost', port:2375, protocol:'http:'})
  t.end()
})

tape('short', function(t) {
  t.same(host(':2375'), {host:'localhost', port:2375, protocol:'http:'})
  t.end()
})

tape('long', function(t) {
  t.same(host('http://localhost:2375'), {host:'localhost', port:2375, protocol:'http:'})
  t.end()
})

tape('0.0.0.0', function(t) {
  t.same(host('http://0.0.0.0:2375'), {host:'localhost', port:2375, protocol:'http:'})
  t.end()
})

tape('unix', function(t) {
  t.same(host('unix:///foo.sock'), {socketPath:'/foo.sock', host:'localhost', protocol:'http:'})
  t.same(host('/foo.sock'), {socketPath:'/foo.sock', host:'localhost', protocol:'http:'})
  t.end()
})

tape('env', function(t) {
  process.env.DOCKER_HOST = ''
  t.same(host(), {socketPath:'/var/run/docker.sock', host:'localhost', protocol:'http:'})
  process.env.DOCKER_HOST = 'unix:///env.sock'
  t.same(host(), {socketPath:'/env.sock', host:'localhost', protocol:'http:'})
  t.end()
})
