const express = require('express')
const bodyParser = require('body-parser')

const app = express()

// parse application/json
var jsonParser = bodyParser.json()

app.get('/', jsonParser, (req, res) => {
	if(req.query['hub.challenge'] != null)
		res.status(200).send(req.query['hub.challenge'])
	else
		console.log(req.body)
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))
