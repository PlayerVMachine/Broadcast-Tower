const express = require('express')
const bodyParser = require('body-parser')

const app = express()

// parse application/json
var jsonParser = bodyParser.json()

app.get('/', jsonParser, (req, res) => {
	res.send(req.query['hub.challenge'])
	console.log(req)
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))
