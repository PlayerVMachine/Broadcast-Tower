// npm requires
const MongoClient = require('mongodb').MongoClient
const f = require('util').format
const TwitchHelix = require('twitch-helix')
const request = require('superagent')

// project files required
const config = require('./config.json')
const reply = require('./proto_messages.json')

// mongodb login
const user = encodeURIComponent(config.user)
const password = encodeURIComponent(config.pass)
const authMechanism = 'DEFAULT'
const url = f('mongodb://%s:%s@127.0.0.1:36505/broadcast_tower?authMechanism=%s', user, password, authMechanism)

//twitch API
const twitchApi = new TwitchHelix({
    clientId: config.twitchID,
    clientSecret: config.twitchSecret
})


exports.twitchStreamSub = async (msg, args, bot) => {
	let client = await MongoClient.connect(url)
	const twitchCol = client.db(config.db).collection('TwitchStream') //DB in form of twitch streamid, usersSubbed
	const usersCol = client.db(config.db).collection('Users') //Tower's users

	let usee = await usersCol.findOne({user: msg.author.id})
	if (usee === null) {
		bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
		return
	}

	let streamer = await twitchApi.getTwitchUserByName(args[0])

	//if the streamer hasn't been followed by a user yet add them to the collection
	let streamSubList = await twitchCol.findOne({StreamerID: streamer.id})
	if (streamSubList === null){
		let addStreamer = await twitchCol.insertOne({StreamerID: streamer.id, followers: []})
		if (addStreamer.insertedCount === 1){
			bot.createMessage(config.logChannelID, f('Streamer %s followed', streamer.display_name))
			let topic = 'https://api.twitch.tv/helix/streams?user_id=' + streamer.id

			request.post('https://api.twitch.tv/helix/webhooks/hub')
			.send({"hub.mode":"subscribe",
				"hub.topic":topic,
    			"hub.callback":"http://208.113.133.141:",
    			"hub.lease_seconds":"864000",
    			"hub.secret":config.twitchSecret})
			.set('Client-ID', config.twitchID)
			.set('Content-Type', 'application/json').end((err, res) => {
				console.log(res.statusCode)
				console.log(err)
			})

		} else {
			bot.createMessage(config.logChannelID, f('Streamer %s could not be followed', streamer.display_name))
		}
	}

	//add the user to the streamer's follower list
	let addFollower = await twitchCol.findOneAndUpdate({StreamerID: streamer.id}, {$addToSet: {followers:usee._id}})
	if(addFollower.ok !== 1) {
		bot.createMessage(msg.channel.id, 'There was an error subscribing to twitch stream notifications O///O')
		return
	}


}