var defaultcss = require('../');
var crel = require('crel');

defaultcss('widget', '.widget { background: red; width: 50px; height: 50px }');
document.body.appendChild(crel('div', { class: 'widget' }));