// npm requires
const MongoClient = require('mongodb').MongoClient
const f = require('util').format
const TwitchHelix = require("twitch-helix")
const TwitchWebhook = require('twitch-webhook')

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

//twitch webhook
const twitchWebhook = new TwitchWebhook({
    client_id: config.twitchID,
    callback: 'http://208.113.133.141/',
    secret: config.twitchSecret,
    listen: {
        autoStart: true
    }
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
	bot.createMessage(msg.channel.id, JSON.stringify(streamer))

	//if the streamer hasn't been followed by a user yet add them to the collection
	let streamSubList = await twitchCol.findOne({StreamerID: streamer.id})
	if (streamSubList === null){
		let addStreamer = await twitchCol.insertOne({StreamerID: streamer.id, followers: []})
		if (addStreamer.insertedCount === 1){
			bot.createMessage(config.logChannelID, f('Streamer %s followed', streamer.display_name))

			//set listener for new streamer we care about
			twitchWebhook.on('streams', ({ event }) => {
 				console.log('a stream happened!')
 				console.log(JSON.strinngify(event))
			})

			//subscribe
			twitchWebhook.subscribe('streams', {user_id:streamer.id})
			let hi = await twitchWebhook.isListening()
			console.log(hi)

			//resub on timeout (10 days)
			twitchWebhook.on('unsubscibe', (obj) => {
  				twitchWebhook.subscribe(obj['hub.topic'])
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