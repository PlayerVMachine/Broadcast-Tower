const express = require('express')
const bodyParser = require('body-parser')

const app = express()

// parse application/json
var jsonParser = bodyParser.json()

app.get('/', jsonParser, (req, res) => {
	//res.send('Hello World!')
	console.log(req.body)
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))
