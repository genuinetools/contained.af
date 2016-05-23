# docker-browser-console

Forward input/output from docker containers to your browser

```
npm install docker-browser-console
```

To quickly try out a demo clone this repo and

```
npm install
npm run demo
```

## Browser usage

First browserify the following code to `bundle.js` to create a terminal in your browser

``` js
var docker = require('docker-browser-console')
var websocket = require('websocket-stream')

// create a stream for any docker image
// use docker({style:false}) to disable default styling
// all other options are forwarded to the term.js instance
var terminal = docker()

// connect to a docker-browser-console server
terminal.pipe(websocket('ws://localhost:10000')).pipe(terminal)

// append the terminal to a DOM element
terminal.appendTo(document.body)
```

You can add that to an `index.html` page by doing

``` html
<!DOCTYPE html>
<html>
<body>
  <script src="bundle.js">
</body>
</html>
```

## Server usage

Then create a server that will host our docker containers

``` js
var ws = require('ws')
var websocket = require('websocket-stream')
var docker = require('docker-browser-console')

var server = new ws.Server({port:10000})

server.on('connection', function(socket) {
  socket = websocket(socket)
  // this will spawn the container and forward the output to the browser
  socket.pipe(docker('mafintosh/dev')).pipe(socket)
})
```

Now simply run the server and open `index.html` in your browser.
You should be able to see a terminal running my dev image

## License

MIT
