//module imports
const Eris = require('eris');

//project module imports
const config = require('./config.json')
const fns = require('./utilities.js') // useful functions
const db = require('./queries.js') // database queries
const commands = require('./commands.js'); //actual bot commands moduled for tidiness


//comand client
const bot = new Eris.CommandClient(config.BOT_TOKEN, {
	defaultImageSize:256
}, {
	description:'Discord bot providing social media functions',
	name:'Broadcast Tower',
	owner:'PlayerVMachine#6223',
	prefix: 'b.'
})


//ready
bot.on("ready", () => { // When the bot is ready
    console.log("The Tower of Power is online!") // Log "Ready!"
});

////////////////////////
//Bot commands!      //
//////////////////////

const ping = bot.registerCommand('ping', 'Pong!', {
	caseInsensitive:true,
	cooldown: 5000,
	cooldownMessage: 'The Signal is strong fear not.',
	description:'No one asks how the bot is only ping',
	usage:'duh'
})

const createAccount = bot.registerCommand('create', async (msg, args) => {
	let hasAccount = await db.userExists(msg.author.id);

	if (hasAccount === 0 ) {
		commands.create(msg, bot)
	} else if (hasAccount === 1) {
		return 'Woah you already have a broadcast station!'
	} else {
		return msg.author.username + ', sorry an antenna broke somewhere! If this message persists contact Hal.'
	}

}, {

})


//actually connect
bot.connect()