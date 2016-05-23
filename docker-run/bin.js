#!/usr/bin/env node

var run = require('./')
var minimist = require('minimist')
var fs = require('fs')
var path = require('path')

var argv = minimist(process.argv.slice(2), {
  boolean: ['tty', 'remove', 'version', 'privileged'],
  alias: {
    tty:'t',
    remove:'r',
    host:'h',
    net:'n',
    network:'net',
    port:'p',
    env:'e',
    volume:'v',
    dns:'d'
  },
  '--': true,
  default: {
    tty: process.stdin.isTTY && process.stdout.isTTY,
    remove: true,
    width: process.stdout.columns,
    height: process.stdout.rows
  }
})

if (argv.version) {
  console.log(require('./package').version)
  return process.exit()
}

if (!argv._.length || argv.help) {
  console.error(fs.readFileSync(require.resolve('./help.txt'), 'utf-8'))
  return process.exit(argv.help ? 0 : 1)
}

var parsePorts = function() {
  if (!argv.port) return null
  return [].concat(argv.port).reduce(function(ports, p) {
    var parts = p.toString().split(':')
    ports[parts[0]] = parts[1] || parts[0]
    return ports
  }, {})
}

var parseEnv = function() {
  if (!argv.env) return null
  return [].concat(argv.env).reduce(function(env, e) {
    e = e.toString()
    var i = e.indexOf('=')
    if (i === -1) return env
    env[e.slice(0, i)] = e.slice(i+1).replace(/^["']|["']$/, '')
    return env
  }, {})
}

var parseVolumes = function() {
  if (!argv.volume) return null
  return [].concat(argv.volume).reduce(function(volumes, v) {
    var parts = v.split(':')
    volumes[path.resolve(process.cwd(), parts[0])] = parts[1] || parts[0]
    return volumes
  }, {})
}

argv.argv = argv['--']
argv.ports = parsePorts()
argv.env = parseEnv()
argv.volumes = parseVolumes()

var image = argv._[0]
var child = run(image, argv)

if (argv.tty && !argv.fork) process.stdin.setRawMode(true)

if (!argv.fork) {
  process.stdin.pipe(child.stdin)
  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)
}

process.stdout.on('resize', function() {
  child.resize(process.stdout.columns, process.stdout.rows)
})

child.on('error', function(err) {
  console.error('Error: %s', err.message)
  process.exit(1)
})

child.on('exit', function(code) {
  process.exit(code)
})

process.on('SIGINT', function() {
  child.destroy()
})

process.on('SIGQUIT', function() {
  child.destroy()
})

process.on('SIGTERM', function() {
  child.destroy()
})
