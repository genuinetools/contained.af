# contained.af

A stupid game for learning about capabilities and syscalls, WIP.

[![Travis CI](https://travis-ci.org/jfrazelle/contained.af.svg?branch=master)](https://travis-ci.org/jfrazelle/contained.af)

To add a question edit this file: [static/js/questions.js](static/js/questions.js).

## Run contained.af locally

Contained is made of a few components:

  * A static HTML and JavaScript frontend in `static/`
  * A Go web server in the project root
  * An isolated Docker installation, running inside a Docker container
    ("Docker-in-Docker").

Prepare the static assets with:

```
make dev
```

Start an isolated Docker instance in the background with:

```
make dind
```

Build and run the server with:

```
make run
```

After a few moments, contained will be available at http://localhost:1234/.
