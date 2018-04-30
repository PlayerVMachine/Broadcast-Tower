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

	db.newUser(msg, dmChan.id, bot)

} , {
	argsRequired: false,
	aliases:["register", "reg"],
	description: "Create an account with the Tower",
	invalidUsageMessage:"That's not how this command works",
	fullDescription: "Create an account with the Tower to send/recieve broadcasts",
	usage:"b.create"
});

//Set a tagline
const tagline = bot.registerCommand('tagline', (msg, args) => {

	db.setTagline(msg, args.join(' '), bot);

}, {
	aliases:["update"],
	description: "Edit your account information",
	invalidUsageMessage:"That's not how this command works",
	fullDescription: "Edit your account information: profile, tagline",
	usage:"b.edit [option]"
});

const bio = bot.registerCommand('bio', (msg, args) => {

	db.setBio(msg, args.join(' '), bot);

}, {
	description: "Edit your account information",
	invalidUsageMessage:"That's not how this command works",
	fullDescription: "Edit your account information: profile, tagline",
	usage:"b.edit [option]"
});

const follow = bot.registerCommand('follow', (msg, args) => {

	db.addToFollowing(msg, args[0], bot);

}, {
	aliases:["fol"],
	description: "Edit your account information",
	invalidUsageMessage:"That's not how this command works",
	fullDescription: "Edit your account information: profile, tagline",
	usage:"b.edit [option]"
});


//###########################################
//Eval command with helper function that prevents mentions from being resolved if returned
//###########################################

const noMention = text => {
	if (typeof(text) === "string")
		return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
	else
		return text;
}

const beval = bot.registerCommand('eval', async (msg, args) => {
	try {
		const code = args.join(" ");
		let evaled = await eval(code);

		if (typeof evaled !== "string")
			evaled = require("util").inspect(evaled);

		return noMention(evaled);
	} catch (err) {
		return `\`ERROR\` \`\`\`xl\n${noMention(err)}\n\`\`\``;
	}
}, {
	requirements: {
		userIDs: config.creator
	}
});

//###########################################
//Startup
//###########################################

bot.on("ready", () => {
	console.log("The Tower of Power is online.");
});

bot.connect();