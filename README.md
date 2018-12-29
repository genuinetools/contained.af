# contained.af

[![Travis CI](https://img.shields.io/travis/genuinetools/contained.af.svg?style=for-the-badge)](https://travis-ci.org/genuinetools/contained.af)
[![GoDoc](https://img.shields.io/badge/godoc-reference-5272B4.svg?style=for-the-badge)](https://godoc.org/github.com/genuinetools/contained.af)
[![Github All Releases](https://img.shields.io/github/downloads/genuinetools/contained.af/total.svg?style=for-the-badge)](https://github.com/genuinetools/contained.af/releases)

A game for learning about containers, capabilities, and syscalls.

To add a question edit this file: [frontend/js/questions.js](frontend/js/questions.js).

<!-- toc -->

- [Run contained.af locally](#run-containedaf-locally)

<!-- tocstop -->

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