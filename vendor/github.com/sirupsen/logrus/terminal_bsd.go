//go:build (darwin || freebsd || openbsd || netbsd || dragonfly) && !appengine && !gopherjs
// +build darwin freebsd openbsd netbsd dragonfly
// +build !appengine
// +build !gopherjs

package logrus

import "golang.org/x/sys/unix"

const ioctlReadTermios = unix.TIOCGETA

type Termios unix.Termios
