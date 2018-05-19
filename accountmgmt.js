// npm requires
const MongoClient = require('mongodb').MongoClient
const f = require('util').format

// project files required
const config = require('./config.json')
const reply = require('./proto_messages.json')
const fns = require('./utilities.js')

// mongodb login
const user = encodeURIComponent(config.user)
const password = encodeURIComponent(config.pass)
const authMechanism = 'DEFAULT'

const url = f('mongodb://%s:%s@127.0.0.1:36505/broadcast_tower?authMechanism=%s', user, password, authMechanism)

exports.create = async (msg, bot, client) => {
	const col = client.db(config.db).collection('Users')

	let found = await col.findOne({user: msg.author.id})
	if (found === null) {

		let dmChannel = await msg.author.getDMChannel()

		const userdata = {
			user: msg.author.id,
			status: 'active',
			tagline: '',
			bio: '',
			following: [],
			followers: [],
			blocked: [],
			streams: [],
			weather: {location: '', deg: ''},
			sendTo: dmChannel.id,
			private: false,
			mature: false,
			dnd: false,
			joined: new Date(),
			eColor: config.color,
			premium: 0
		}

		let created = await col.insertOne(userdata)
		if (created.insertedCount === 1) { 
			bot.createMessage(msg.channel.id, f(reply.create.success, msg.author.username))
		} else { 
			bot.createMessage(msg.channel.id, f(reply.create.error, msg.author.username))
		}
	} else {
		bot.createMessage(msg.channel.id, f(reply.create.alreadyHasAccount, msg.author.username))
	}
}

const del = async (msg, bot, col) => {
	//delete user from the followers list of people they're following
	let rem = await col.updateMany({following: msg.author.id}, {$pull: {following: msg.author.id, followers: msg.author.id}})

	if (rem.result.ok === 1) {

		let del = await col.findOneAndDelete({user: msg.author.id})

		if (del.ok === 1) {
			bot.createMessage(msg.channel.id, f(reply.close.success, msg.author.username))
		} else {
			bot.createMessage(msg.channel.id, f(reply.close.error, msg.author.username))
		}
	} else {
		bot.createMessage(msg.channel.id, f(reply.close.error, msg.author.username))
	}
}

exports.close = async (msg, bot, client) => {
	const col = client.db(config.db).collection('Users')

	let min = Math.ceil(1000)
	let max = Math.floor(9999)
	let confirm = Math.floor(Math.random() * (max - min)) + min

	var medit

	const confirmation = async (response) => {
		res = response.content.split(' ')[0];
		if (response.author.id === msg.author.id && res === confirm.toString()) {
        	//confirmation code entered correctly
        	del(msg, bot, col)
        	bot.removeListener('messageCreate', confirmation)
        	clearTimeout(medit)
        } else if (response.author.id === msg.author.id && response.content === 'cancel') {
			//user cancelled closing
        	bot.createMessage(msg.channel.id, f(reply.close.cancelled, msg.author.username))
        	bot.removeListener('messageCreate', confirmation)
        	clearTimeout(medit)
        } else if (response.author.id === msg.author.id && res !== confirm.toString()) {
        	//confirmation code entered incorrectly
        	bot.createMessage(msg.channel.id, f(reply.close.wrongCode, msg.author.username))
        	bot.removeListener('messageCreate', confirmation)
        	clearTimeout(medit)
        }
    }

    let found = await col.findOne({user: msg.author.id})
    if (found === null) {
    	bot.createMessage(msg.channel.id, f(reply.generic.useeNoAccount, msg.author.username))
    } else {
    	let delMessage = await bot.createMessage(msg.channel.id, f(reply.close.confirmation, msg.author.username, confirm))

    	//edit message if no reply in 10s and close listener
    	medit = setTimeout((msgid) => {
    		bot.editMessage(msg.channel.id, msgid, f(reply.close.timeout, msg.author.username))
    		bot.removeListener('messageCreate', confirmation)
    	}, 10000, delMessage.id)

    	//register event listener for close confirmation/cancel
    	bot.on('messageCreate', confirmation)
    }
}

exports.heckingBan = (msg, args, bot, client) => {
	const userCol = client.db(config.db).collection('Users')
	const banCol = client.db(config.db).collection('Bans')
}