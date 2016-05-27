var questions = [
    {
        "description": "<code>CAP_NET_RAW</code> allows you to use RAW and PACKET sockets and bind to any address for transparent proxying.",
        "content": "Do you have access to <code>CAP_NET_RAW</code>?",
        "warning": "<strong>Not quite...</strong> Try running <code>ping</code> or <code>wget</code>.",
        "success": "<strong>Congrats!</strong> You are correct.",
        "answer": false
    },
    {
        "description": "The <code>socket</code> syscall socket() creates an endpoint for communication and returns a file descriptor that refers to that endpoint.",
        "content": "Is the <code>socket</code> syscall blocked?",
        "warning": "<strong>Not quite...</strong> Try running <code>nc</code>.",
        "success": "<strong>Congrats!</strong> You are correct.",
        "answer": true
    },
    {
        "description": "The <code>nanosleep</code> syscall  suspends the execution of the calling thread until either at least the time specified in *req has elapsed, or the delivery of a signal that triggers the invocation of a handler in the calling thread or that terminates the process.",
        "content": "Is the <code>nanosleep</code> syscall blocked?",
        "warning": "<strong>Not quite...</strong> Try running <code>sleep</code>.",
        "success": "<strong>Congrats!</strong> You are correct.",
        "answer": true
    }
];
