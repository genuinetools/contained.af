var ws = require('./')
var test = require('tape')

test('echo works', function(t) {
  var stream = ws('ws://localhost:8343')
  stream.on('data', function(o) {
    t.equal(o.toString(), 'hello', 'got hello back')
    stream.destroy()
    t.end()
  })
  stream.write(new Buffer('hello'))
})

test('echo works two times', function(t) {
  var stream = ws('ws://localhost:8343')
  stream.once('data', function(o) {
    t.equal(o.toString(), 'hello', 'got first hello back')
    stream.write(new Buffer('hello'))
    stream.once('data', function(o) {
      t.equal(o.toString(), 'hello', 'got second hello back')
      stream.destroy()
      t.end()
    })
  })
  stream.write(new Buffer('hello'))
})
