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
        description: "AppArmor is a Linux security module that allows for setting permissions and auditing processes.",
        content: "Is the container running with an apparmor profile?",
        warning: "<strong>Not quite...</strong> See profiles by running <code>cat /proc/self/attr/current</code>.",
        success: "<strong>Congrats!</strong> You are correct.",
        answer: false
    },
    {
        description: "<code>CAP_SYS_ADMIN</code> syscall allows you to do all kinds of things. Override resource limits! Call <code>perf_event_open</code>! See <a href='http://man7.org/linux/man-pages/man7/capabilities.7.html'>the capabilities man page</a> for the full list",
        content: "Do you have access to <code>CAP_SYS_ADMIN</code>?",
        warning: "<strong>Not quite...</strong> Try mounting a tmpfs with <code>mount</code>.",
        success: "<strong>Congrats!</strong> You are correct.",
        answer: false
    },
    {
        description: "<code>CAP_SYS_TIME</code> is the capability that allows a user to set the system clock or real-time (hardware) clock",
        content: "Do you have access to <code>CAP_SYS_TIME</code>?",
        warning: "<strong>Not quite...</strong> Try running <code>date -s '00:00:01'</code>.",
        success: "<strong>Congrats!</strong> You are correct.",
        answer: false
    },
    {
        description: "<code>CAP_SYSLOG</code> is the capability that allows a user to execute syslog privilegied operations",
        content: "Do you have access to <code>CAP_SYSLOG</code>?",
        warning: "<strong>Not quite...</strong> Try running <code>dmesg -c</code>.",
        success: "<strong>Congrats!</strong> You are correct.",
        answer: false
    }

];
