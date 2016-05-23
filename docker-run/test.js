var tape = require('tape')
var concat = require('concat-stream')
var run = require('./')

tape('spawn bash', function(t) {
  var child = run('mafintosh/dev')

  child.stdin.end('echo hello world')
  child.stdout.pipe(concat(function(data) {
    t.same(data.toString(), 'hello world\n', 'echoes hello world')
    t.end()
  }))
})

tape('destroy', function(t) {
  var child = run('mafintosh/dev')

  child.destroy()
  child.on('exit', function(code) {
    t.ok(code !== 0, 'not ok exit')
    t.end()
  })
})