var questions = [
    {
        description: "<code>CAP_NET_RAW</code> allows you to use RAW and PACKET sockets and bind to any address for transparent proxying.",
        content: "Do you have access to <code>CAP_NET_RAW</code>?",
        warning: "<strong>Not quite...</strong> Try running <code>ping</code> or <code>wget</code>.",
        success: "<strong>Congrats!</strong> You are correct.",
        answer: false
    },
    {
        description: "The <code>socket</code> syscall socket() creates an endpoint for communication and returns a file descriptor that refers to that endpoint.",
        content: "Is the <code>socket</code> syscall blocked?",
        warning: "<strong>Not quite...</strong> Try running <code>nc</code>.",
        success: "<strong>Congrats!</strong> You are correct.",
        answer: true
    },
    {
        description: "The <code>nanosleep</code> syscall  suspends the execution of the calling thread until either at least the time specified in *req has elapsed, or the delivery of a signal that triggers the invocation of a handler in the calling thread or that terminates the process.",
        content: "Is the <code>nanosleep</code> syscall blocked?",
        warning: "<strong>Not quite...</strong> Try running <code>sleep</code>.",
        success: "<strong>Congrats!</strong> You are correct.",
        answer: true
    },
    {
        description: "<code>CAP_SYS_ADMIN</code> syscall allows you to do all kinds of things. Override resource limits! Call <code>perf_event_open</code>! See <a href='http://man7.org/linux/man-pages/man7/capabilities.7.html'>the capabilities man page</a> for the full list",
        content: "Do you have access to <code>CAP_SYS_ADMIN</code>?",
        warning: "<strong>Not quite...</strong> Try mounting a tmpfs with <code>mount</code>.",
        success: "<strong>Congrats!</strong> You are correct.",
        answer: false
    }
    
];
