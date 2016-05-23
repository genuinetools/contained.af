var tape = require('tape')
var concat = require('concat-stream')
var through = require('through2')
var raw = require('./')

tape('stdout', function(t) {
  var d = raw.decode()
  var e = raw.encode()

  e.stdout.write('hello stdout')
  e.stdout.end()

  e.pipe(d)

  d.stdout.pipe(concat(function(data) {
    t.same(data.toString(), 'hello stdout')
    t.end()
  }))
})

tape('stderr', function(t) {
  var d = raw.decode()
  var e = raw.encode()

  e.stderr.write('hello stderr')
  e.stderr.end()

  e.pipe(d)

  d.stderr.pipe(concat(function(data) {
    t.same(data.toString(), 'hello stderr')
    t.end()
  }))
})

tape('stdout + stderr', function(t) {
  t.plan(2)

  var d = raw.decode()
  var e = raw.encode()

  e.stderr.write('hello stderr #1\n')
  e.stdout.write('hello stdout #1\n')
  e.stderr.write('hello stderr #2\n')
  e.stdout.write('hello stdout #2\n')
  e.stdout.end()

  e.pipe(d)

  d.stderr.pipe(concat(function(data) {
    t.same(data.toString(), 'hello stderr #1\nhello stderr #2\n')
  }))

  d.stdout.pipe(concat(function(data) {
    t.same(data.toString(), 'hello stdout #1\nhello stdout #2\n')
  }))
})

tape('halfOpen', function(t) {
  var d = raw.decode()
  var e = raw.encode({halfOpen:true})
  var ended = false

  e.stderr.write('hello stderr')
  e.stderr.end(function() {
    process.nextTick(function() {
      ended = true
      e.stdout.end()
    })
  })

  e.pipe(d)

  d.stderr.pipe(concat(function(data) {
    t.ok(ended)
    t.same(data.toString(), 'hello stderr')
    t.end()
  }))
})