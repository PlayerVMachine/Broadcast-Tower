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

const eval = bot.registerCommand("eval", (msg, args) => {
	if (msg.author.id === config.creator) {
		try {
			res = parseJSON(args.join(" "));
			return "```\n" + res + "\n```";
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

		bot.createMessage(msg.channel.id, "Your tagline is: " + tagline[0].Tagline);
		bot.createMessage(msg.channel.id, "Enter a new tagline:");

		bot.on('messageCreate', async (newmsg) => {
			if (newmsg.author.id === msg.author.id) {
 				let res = await db.set("Tagline", newmsg.author.id, "Users", newmsg.content);
 				if (res === 1)
 					bot.createMessage(msg.channel.id, "Tagline updated successfully: " + newmsg.content);
 				else
 					bot.createMessage(msg.channel.id, "An error occured setting your tagline please try again.");
 			}
 		});

	} catch (e) {
		console.log(e);
	}
}, {
	description: "Edit your tagline",
	fullDescription: "Edit your tagline, maximum 140 characters"
});

edit.registerSubcommand ("profile", async (msg, args) => {
	try {
		let tagline = await db.get("Profile", msg.author.id, "Users");

		bot.createMessage(msg.channel.id, "Your Profile is: " + tagline[0].Profile);
		bot.createMessage(msg.channel.id, "Enter a new profile:");

		bot.on('messageCreate', async (newmsg) => {
			if (newmsg.author.id === msg.author.id) {
 				let res = await db.set("Profile", newmsg.author.id, "Users", newmsg.content);
 				if (res === 1)
 					bot.createMessage(msg.channel.id, "Profile updated successfully: " + newmsg.content);
 				else
 					bot.createMessage(msg.channel.id, "An error occured setting your profile please try again.");
 			}
 		});

	} catch (e) {
		console.log(e);
	}
}, {
	description: "Edit your tagline",
	fullDescription: "Edit your tagline, maximum 500 characters"
});

//Get Status, possible statuses: actvie, banned, disabled,
edit.registerSubcommand ("status", async (msg,args) => {
	try {
		let status = await db.get("State", msg.author.id, "Users");

		bot.createMessage(msg.channel.id, "Your account status is: " + status[0].State);

		if (status[0].State === 'Banned')
			bot.createMessage(msg.channel.id, "To appeal your ban head to <discord.gg/something> ");

	} catch(e) {
		console.log(e)
	}
}, {
	description: "View your accout status",
	fullDescription: "View your account status"
});

//follow a user
const follow = bot.registerCommand ("follow", async (msg, args) => {
	try {
		let following = await db.get("Following", msg.author.id, "Users");

		list = parseJSON(following[0].Following);
		list.indexOf(args[0])


	} catch (e) {
		console.log(e);
	}
}, {
	description: "Follow a user",
	fullDescription: "Follow a user, allows you to receive their posts"
});

//Send post


//Delete post




function parseJSON(obj) {
    return Function('"use strict";return (' + obj + ')')();
}

//start
bot.on("ready", () => {
	console.log("The Tower of Power is online.");
});

bot.connect();