# defaultcss

A very simple module for creating a little bit of defaultcss.  This is
really useful if you are creating a small JS widget that you want to be
completely stylable by the application implementer but would also like it
to look "kind of ok" if someone want to have a quick play.


[![NPM](https://nodei.co/npm/defaultcss.png)](https://nodei.co/npm/defaultcss/)


## How it Works

The provided css text is injected into the HTML document within the document
`<head>` prior to any other `<link>` or `<style>` tags.  This ensures that
any definitions that are made within your provided CSS have ample
opportunity to be overridden by user defined CSS.

## Example Usage

```js
var defaultcss = require('defaultcss');
var crel = require('crel');

defaultcss('widget', '.widget { background: red; width: 50px; height: 50px }');
document.body.appendChild(crel('div', { class: 'widget' }));
```

## Reference

### defaultcss

```
defaultcss(label, csstext)
```

Create a new default `style` element and use the provided `label` to
generate an id for the element "%label%_defaultstyle".  If an existing
element with that id is found, then do nothing.

If not, then create the new element and use the provided `csstext` as
`innerText` for th element.

## License(s)

### ISC

Copyright (c) 2014, Damon Oehlman <damon.oehlman@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
