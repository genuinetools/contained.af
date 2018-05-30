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
			term.fit();
			socket.send(JSON.stringify({
				type: 'resize',
				width: term.cols,
				height: term.rows
			}));
		};
        var loadQuestion = function(index) {
            $('#question').addClass('invisible');
            var q = questions[index];

            if (index == questions.length - 1){
                $('#next').addClass('invisible');
            }

            $('#question blockquote p').html(q.description);
            $('#question .content').html(q.content);
            $('#question #correct').addClass('hide');
            $('#question #warning').addClass('hide').html(q.warning);
            $('#question #correct p').html(q.success);
            $('#question #current').val(index);

            $('#question #hint').addClass('hide');

            $('#question blockquote').removeClass('invisible');
            $('#question .content').removeClass('invisible');
            $('#question .btn').removeClass('invisible');

            $('#question').removeClass('invisible');
        };

        var doHint = function(q){
            if (q.hints.length > 0) {
                var hint = q.hints[Math.floor(Math.random() * q.hints.length)];
                $('#question #hint').html(hint);
                $('#question #hint').removeClass('hide');
            }
        };

        var doWrong = function(){
            $('#question #correct').addClass('hide');
            $('#question #warning').removeClass('hide');
        };

        var doCorrect = function(){
            $('#question #correct').removeClass('hide');
            $('#question #warning').addClass('hide');

            $('#question blockquote').addClass('invisible');
            $('#question .content').addClass('invisible');
            $('#question .btn').addClass('invisible');
        };

        $('#yes').click(function(){
            var index = $('#question #current').val();
            //console.log("index: ", index);
            //console.log("question: ", questions[index]);
            //console.log("answer: ", questions[index].answer);
            if (questions[index].answer){
                doCorrect();
            } else {
                doWrong();
            }
        });

        $('#no').click(function(){
            var index = $('#question #current').val();
            //console.log("index: ", index);
            //console.log("question: ", questions[index]);
            //console.log("answer: ", questions[index].answer);
            if (!questions[index].answer){
                doCorrect();
            } else {
                doWrong();
            }
        });

        $('#hintme').click(function(){
            var index = $('#question #current').val();
            //console.log("index: ", index);
            doHint(questions[index]);
        });

        $('#next').click(function(){
            var index = $('#question #current').val();
            index++;
            loadQuestion(index);
        });

		var proto = 'ws';
		if (location.protocol == "https:"){
			proto = 'wss';
		}

		// create the socket
		var socket = new WebSocket(proto+'://'+location.host+"/term");

		var term = new Terminal({
			cursorBlink: true
		});

		term.on('title', function(title) {
			document.title = title;
		});

		term.open(elem);

		socket.onopen = function (event) {
			windowSize(term, socket);
            loadQuestion(0);
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

