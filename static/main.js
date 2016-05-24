;(function() {
	window.onload = function() {
		var elem = document.getElementById('console');

		function computedStyle(a,b,c,d){return c=window.getComputedStyle,d=c?c(a):a.currentStyle,d?d[b.replace(/-(\w)/gi,function(a,b){return b.toUpperCase()})]:void 0};

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
		}();

		var get = function(name) {
			//console.log(name, "dimensions", dimensions);
			//console.log("computed style", computedStyle(elem, name));

			return Math.floor(parseInt(computedStyle(elem, name), 10) / dimensions[name === 'width' ? 0 : 1]);
		};

		var windowSize = function(term, socket) {
			var wid = get('width'),
				hei = get('height');

			term.resize(wid, hei);
			socket.send(JSON.stringify({
				type: 'resize',
				width: wid,
				height: hei
			}));

			//console.log("width", wid);
			//console.log("height", hei);
		};

		var proto = 'ws';
		if (location.protocol == "https:"){
			proto = 'wss';
		}

		// create the socket
		var socket = new WebSocket(proto+'://'+location.host+"/term");
		var wid = get('width'),
			hei = get('height');

		var term = new Terminal({
			columns: wid,
			rows: hei,
			useStyle: true,
			screenKeys: true,
			cursorBlink: true
		});

		term.on('title', function(title) {
			document.title = title;
		});

		term.open(elem);

		socket.onopen = function (event) {
			windowSize(term, socket);
		};

		term.on('data', function(data) {
			socket.send(JSON.stringify({
				type:'stdin',
				data: data
			}));
		});

		socket.onmessage = function (event) {
			//console.log("input", JSON.stringify(event));
			var obj = JSON.parse(event.data);
			//console.log("data", obj.data);
			term.write(obj.data);
		};

		socket.onclose = function (event) {
			term.destroy()
		};

		window.onresize = function(event) {
			windowSize(term, socket);
		};

	};
}).call(this);

