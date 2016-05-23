var api = require('./')

var request = api({version:'v1.12'})

request.get('/images/json', {json:true}, console.log)
