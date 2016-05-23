var Terminal = require('term.js')
var computed = require('computed-style')
var ndjson = require('ndjson')
var duplexify = require('duplexify')
var defaultcss = require('defaultcss')
var fs = require('fs')

var on = function(elem, evt, fn) { // TODO: find module
  elem.addEventListener(evt, fn, false)
}

var off = function(elem, evt, fn) { // TODO: find module
  elem.removeEventListener(evt, fn, false)
}

module.exports = function(opts) {
  if (!opts) opts = {}

  var result = duplexify()

  result.appendTo = function(elem) {
    if (typeof elem === 'string') elem = document.querySelector(elem)
    if (opts.style !== false) defaultcss('docker-browser-console', require('./style'))
    elem.className += ' docker-browser-console'

    var dimensions = function() {
      var el = document.createElement('div')
      el.innerHTML = 'x'
      el.style.float = 'left'
      el.style.position = 'absolute'
      el.style.left = '-1000px'
      el.style.top = '-1000px'
      elem.appendChild(el)
      var dims = [el.offsetWidth, el.offsetHeight]
      elem.removeChild(el)
      return dims
    }()

    var get = function(name) {
      return Math.floor(parseInt(computed(elem, name), 10) / dimensions[name === 'width' ? 0 : 1])
    }

    var wid = get('width')
    var hei = get('height')

    var onresize = function() {
      var newWid = get('width')
      var newHei = get('height')

      if (newWid === wid && newHei === hei) return

      wid = newWid
      hei = newHei
      term.resize(newWid, newHei)
      output.write({
        type: 'resize',
        width: newWid,
        height: newHei
      })
    }

    if (opts.resize !== false) on(window, 'resize', onresize)

    opts.convertEol = true
    opts.cols = opts.cols || wid
    opts.rows = opts.rows || hei

    var renderer = opts.renderer || Terminal
    var term = result.terminal = new renderer(opts)

    var input = ndjson.parse()
    var output = ndjson.stringify()

    output.write({
      type: 'run',
      width: wid,
      height: hei
    })

    input.on('data', function(data) {
      if (data.type !== 'stderr' && data.type !== 'stdout') return
      term.write(data.data)
      result.emit(data.type, data.data)
    })

    term.open(elem)
    result.setWritable(input)
    result.setReadable(output)

    term.on('data', function(data) {
      output.write({type:'stdin', data:data})
      result.emit('stdin', data)
    })

    term.on('title', function(title) {
      result.emit('title', title)
    })

    result.on('close', function() {
      off(window, 'resize', onresize)
      term.destroy()
    })

    return result
  }

  return result
}
