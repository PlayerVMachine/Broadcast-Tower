const express = require('express')
const app = express()

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(3000, () => console.log('Example app listening on port 3000!'))

/*			
request.post('https://api.twitch.tv/helix/webhooks/hub')
			.send({"hub.mode":"subscribe",
				"hub.topic":topic,
    			"hub.callback":"http://208.113.133.141:3000/",
    			"hub.lease_seconds":"864000",
    			"hub.secret":config.twitchSecret})
			.set('Client-ID', config.twitchID)
			.set('Content-Type', 'application/json').end((err, res) => {
				console.log(res)
				console.log(err)
			})

			*/