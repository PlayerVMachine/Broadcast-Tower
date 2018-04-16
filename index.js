var Eris = require('eris');
var db = require('./queries2.js');
var config = require('./config.json');

const bot = new Eris.CommandClient(config.BOT_TOKEN, {}, {
	description: "Broadcast Tower adds a social media component to your Discord experience",
	owner: "PlayerVM",
	prefix: "b."
});

//ping
const ping = bot.registerCommand("ping", "Pong!", {
	//responds with "Pong!" when someone says "b.ping"
	description: "Pong!",
	fullDescription: "Use this to check if the bot is up or you're bored"
});

//Query Tester
const qeval = bot.registerCommand("qeval", async (msg, args) => {
	if (msg.author.id === config.creator) {
		try {
			let res = await db.test_query(args.join(" "));
			return "```\n" + JSON.stringify(res) + "\n```";
		} catch (error) {
			return "```\n The promise was rejected: " + error + "\n```";
		}

	} else {
		return "Unathorized! :angry:"
	}
});

//Create User
const create = bot.registerCommand("create", async (msg, args) => {
	let check = await db.get("User", msg.author.id, "Users"); //Check if user exists

	if (!Object.keys(check).length) {

		let dmChan = await msg.author.getDMChannel();

		let res = await db.new_user(msg.author.id, dmChan.id);
		if (res === 1)
			return "```\nAccount created successfully! \nCustomize your tagline and profile using b.edit tagline or b.edit profile \nFollow people using b.follow userid/mention\n```";
		else
			return "There was an error creating your account. " + res;
	} else {
		return "Looks like you already have an account!";
	}


} , {
	description: "create",
	fullDescription: "Create an account to send/recieve broadcasts"
});

//Edit profile + subcommands
const edit = bot.registerCommand("edit", (msg, args) => {

}, {
	description: "edit",
	fullDescription: "Edit your profile! Subcommands: `tagline`, `profile`"
});

edit.registerSubcommand ("tagline", async (msg, args) => {
	try {
		let tagline = await db.get("Tagline", msg.author.id, "Users");
		response = "Your tagline is: " + JSON.stringify(tagline);

		let res = await bot.createMessage(msg.channel, response);

	} catch (e) {
		console.log(e);
	}


	//bot.createMessage(msg.channel, "Enter a new tagline:");

 	//bot.on('messageCreate', (msg) => {
 	//	console.log(msg.content);
 	//});

}, {
	description: "Edit your tagline",
	fullDescription: "Edit your tagline"
});

//Set Status


//Send post


//Delete post


//Set post recieve location (default is DMs)



//start
bot.on("ready", () => {
	console.log("The Tower of Power is online.");
});

bot.connect();