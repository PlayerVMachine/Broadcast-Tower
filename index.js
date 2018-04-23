const Eris = require('eris');

const config = require('./config.json');	//secrets
const bcast = require('./broadcast.js');	//broadcast tower functions
const db = require('./queries.js');		//database queries
const util = require('./helper.js');		//useful functions


//Create the bot with a few basic options
const bot = new Eris.CommandClient(config.BOT_TOKEN, {}, {
	description: "Broadcast Tower adds a social media component to your Discord experience",
	owner: "PlayerVM",
	prefix: "b."
});


//###########################################
//Testing commands
//###########################################

//ping
const ping = bot.registerCommand('ping', 'Pong!', {
	//responds with "Pong!" when someone says "b.ping"
	description: "Pong!",
	fullDescription: "Use this to check if the bot is up or you're bored",
});

//Query Tester
const qeval = bot.registerCommand('qeval', async (msg, args) => {
	
	//evaluates the sql query contained in args
	let res = await bcast.qeval(args, bot);

	bot.createMessage(msg.channel.id, res);

}, {
	argsRequired: true,
	descritpion:"Evaluate a SQL query",
	invalidUsageMessage:"That's not how this command works",
	permissionMessage:"I'm sorry you don't have permission to use this command",
	requirements:{userIDs:[config.creator]}
});


//###########################################
//User CRUD commands
//###########################################

//Create a user account with the tower
const create = bot.registerCommand('create', async (msg, args) => {
	
	let res = await bcast.create(msg, args, bot);

	bot.createMessage(msg.channel.id, res);

} , {
	argsRequired: false,
	aliases:["register", "reg"],
	description: "Create an account with the Tower",
	invalidUsageMessage:"That's not how this command works",
	fullDescription: "Create an account with the Tower to send/recieve broadcasts",
	usage:"b.create"
});

//Edit account profile information
const edit = bot.registerCommand('edit', async (msg, args) => {

	bot.createMessage(msg.channel.id, "Use this command to edit your tagline or profile");

}, {
	aliases:["update"],
	description: "Edit your account information",
	invalidUsageMessage:"That's not how this command works",
	fullDescription: "Edit your account information: profile, tagline",
	usage:"b.edit [option]"
});

edit.registerSubcommand('tagline', async (msg, args) => {

	let res = await db.is_user(msg.author.id);

	if (res)
		bcast.editAccount(msg, args, bot, 'Tagline');
	else
		bot.createMessage(msg.channel.id, "Sorry you need an account to use this command.");

}, {
	aliases:['tag'],
	description: 'Change your tagline',
	invalidUsageMessage: `That's not how this command works`,
	fullDescription: 'Change your tagline maximum 140 characters',
	usage: 'b.edit tagline or b.edit tagline text'
});

edit.registerSubcommand('profile', async (msg, args) => {

	let res = await db.is_user(msg.author.id);

	if (res)
		bcast.editAccount(msg, args, bot, 'Profile');
	else
		bot.createMessage(msg.channel.id, "Sorry you need an account to use this command.");

}, {
	description: 'Change your profile',
	invalidUsageMessage: `That's not how this command works`,
	fullDescription: 'Change your tagline maximum 500 characters',
	usage: 'b.edit profile or b.edit profile text'
});

const follow = bot.registerCommand('follow', async (msg, args) => {

	let res = await db.is_user(msg.author.id);
	userid = util.isID(args[0]);

	if (res && (userid != -1)) {
		bcast.follow(msg, userid, bot);
	} else if (!res) {
		bot.createMessage(msg.channel.id, 'Sorry you need an account to use this command.');	
	} else {
		bot.createMessage(msg.channel.id, 'Please enter a valid mention or user id.');
	}
}, {
	aliases:['fol'],
	description: 'Follow a user',
	invalidUsageMessage: `That's not how this command works`,
	fullDescription: 'Follow a user, use their mention or id',
	usage: 'b.follow `@user` or user id'
});

const unfollow = bot.registerCommand('unfollow', async (msg, args) => {

});

const block = bot.registerCommand('block', async (msg, args) => {

});

const clearDMs = bot.registerCommand('clear', async (msg, args) => {

});

const broadcast = bot.registerCommand('cast', async (msg, args) => {

	let res = await db.is_user(msg.author.id);

	//check contents of post for inapporopriate content
	profane = util.isProfane(msg, bot);
	len = msg.content.length;

	if (res && !profane && len <= 2000)
		bcast.send(msg, args, bot);
	else if (!res)
		bot.createMessage(msg.channel.id, 'Sorry you need an account to use this command.');
	else if (len > 2000)
		bot.createMessage(msg.channel.id, 'Sorry cannot send messages that are over 2000 characters');

}, {
	aliases:['send', 'broadcast'],
	argsRequired: true,
	description: 'Broadcast a message to your followers',
	invalidUsageMessage: `That's not how this command works`,
	fullDescription: 'Broadcast a message to your followers, must be less than 2000 characters and not profane.',
	usage: 'b.send message to send'
});

//###########################################
//Startup
//###########################################

bot.on("ready", () => {
	console.log("The Tower of Power is online.");
});

bot.connect();