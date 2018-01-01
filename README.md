# contained.af

[![Travis CI](https://travis-ci.org/jessfraz/contained.af.svg?branch=master)](https://travis-ci.org/jessfraz/contained.af)

A game for learning about containers, capabilities, and syscalls.

To add a question edit this file: [frontend/js/questions.js](frontend/js/questions.js).

## Run contained.af locally

Contained is made of a few components:

  * A static HTML and JavaScript frontend in `frontend/`
  * A Go web server in the project root
  * An isolated Docker installation, running inside a Docker container
    ("Docker-in-Docker").

Prepare the static frontend assets with:

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

After a few moments, contained will be available at http://localhost:10000/.
