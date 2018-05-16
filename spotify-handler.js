const MongoClient = require('mongodb').MongoClient
const f = require('util').format
const bodyParser = require('body-parser')
const request = require('superagent')


// project files required
const config = require('./config.json')
const reply = require('./proto_messages.json')

// mongodb login
const user = encodeURIComponent(config.user)
const password = encodeURIComponent(config.pass)
const authMechanism = 'DEFAULT'
const url = f('mongodb://%s:%s@127.0.0.1:36505/broadcast_tower?authMechanism=%s', user, password, authMechanism)



const getReleases = async () => {
	let data = config.spotifyID + ':' + config.spotifySecret;  
	let buff = new Buffer(data);  
	let base64data = buff.toString('base64');

	try {
		let client = await MongoClient.connect(url)
		const spotifyCol = client.db(config.db).collection('SpotifyNewReleases')

		let response = await request.post('https://accounts.spotify.com/api/token')
		.send({grant_type:'client_credentials'})
		.set('Authorization', 'Basic ' + base64data)
		.type('application/x-www-form-urlencoded')

		let data = JSON.parse(response.text)
		let token = 'Bearer ' + data.access_token

		let getResponse = await request.get('https://api.spotify.com/v1/browse/new-releases?limit=50')
		.set('Authorization', token)

		let top50newReleasesRAW = JSON.parse(getResponse.text)
		let info = top50newReleasesRAW.albums

		let albums = []
		let position = 1
		for (album in info.items) {
			let record = {
				position: position,
				name: info.items[album].name,
				artist: info.items[album].artists[0].name,
				artist_url: info.items[album].artists[0].href,
				album_url: info.items[album].external_urls.spotify,
				image_url_300: info.items[album].images[1].url,
				release_date: info.items[album].release_date 
			}
			albums.push(record)
			position += 1
		}

		let pushAlbums = await spotifyCol.insertMany(albums)
		if (pushAlbums.insertedCount !== albums.length)
			console.log('Not all albums were pushed: ' + pushAlbums.insertedCount)
		else
			console.log('Top 50 pusehd to db')

	} catch (e) {
		console.log(e)
	}
}

const getAlbum = async () => {
	try {
		let client = await MongoClient.connect(url)
		const spotifyCol = client.db(config.db).collection('SpotifyNewReleases')

	
		let album = await spotifyCol.findOne({position:1})
		console.log(album)
	} catch (e) {
		console.log(e)
	}
}

//getReleases()
getAlbum()