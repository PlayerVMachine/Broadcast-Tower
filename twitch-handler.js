// npm requires
const MongoClient = require('mongodb').MongoClient
const f = require('util').format
const TwitchHelix = require("twitch-helix")

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
	bot.createMessage(msg.channel.id, JSON.stringify(streamer))

}