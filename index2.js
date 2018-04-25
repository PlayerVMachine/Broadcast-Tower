const Eris = require('eris');

const config = require('./config.json');	//secrets
const bcast = require('./broadcast.js');	//broadcast tower functions
const db = require('./mongo_queries.js');		//database queries
const util = require('./helper.js');		//useful functions


//Create the bot with a few basic options
const bot = new Eris.CommandClient(config.BOT_TOKEN, {}, {
	description: "Broadcast Tower adds a social media component to your Discord experience",
	owner: "PlayerVM",
	prefix: "b."
});

//Create a user account with the tower
const create = bot.registerCommand('create', async (msg, args) => {
	
	let dmChan = await msg.author.getDMChannel();

	db.newUser(msg, dmChan.id)

} , {
	argsRequired: false,
	aliases:["register", "reg"],
	description: "Create an account with the Tower",
	invalidUsageMessage:"That's not how this command works",
	fullDescription: "Create an account with the Tower to send/recieve broadcasts",
	usage:"b.create"
});

//###########################################
//Startup
//###########################################

bot.on("ready", () => {
	console.log("The Tower of Power is online.");
});

bot.connect();