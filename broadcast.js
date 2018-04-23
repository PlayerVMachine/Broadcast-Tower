//Command functions here
const config = require('./config.json');	//secrets
const util = require('./helper.js');		//useful functions
const db = require('./queries.js');		//database queries

//evaluate a sql query
exports.qeval = async (args, bot) => {
	try {

		let res = await db.test_query(args.join(" "));
		return util.codeblockify(res);
		
	} catch (error) {

		return util.codeblockify("An error occured: " + error);
		
	}
}

//Create a new user
exports.create = async (msg, args, bot) => {
	let check = await db.is_user(msg.author.id); //Check if user exists

	if (!check) {

		let dmChan = await msg.author.getDMChannel();

		let res = await db.new_user(msg.author.id, dmChan.id);

		if (res === 1)
			return "Account created successfully! \nCustomize your tagline and profile using b.edit tagline or b.edit profile \nFollow people using b.follow userid/mention";
		else
			return "There was an error creating your account. " + res;
	} else {
		return "Looks like you already have an account!";
	}
}

//edit account tagline or profile:
exports.editAccount = async (msg, args, bot, toEdit) => {
	try {
		let res = await db.get(toEdit, msg.author.id, "Users");

		if (toEdit === 'Tagline')
			content = res[0].Tagline;
		else
			content = res[0].Profile

		if (args.length === 0) {
			//user provided no tagline
			bot.createMessage(msg.channel.id, "Your " + toEdit + " is: " + content);
			bot.createMessage(msg.channel.id, "Enter a new" + toEdit + ":");

			bot.on('messageCreate', async (newmsg) => {
				//check if previous message was "Enter new tagline: before accepting the new tagline"
				//seems like a bad idea but not sure how else to fix

				let prev = await bot.getMessages(newmsg.channel.id, 1, newmsg.id)

				if (newmsg.author.id === msg.author.id && prev[0].content === "Enter a new" + toEdit + ":") {
					let res = await db.set(toEdit, newmsg.author.id, "Users", newmsg.content);
					if (res === 1)
						bot.createMessage(msg.channel.id, toEdit + " updated successfully: " + newmsg.content);
					else
						bot.createMessage(msg.channel.id, "An error occured setting your tagline please try again.");
				}
			});
		} else {
			//user provided content
			let res = await db.set(toEdit, msg.author.id, "Users", args.join(" "));

			if (res === 1)
				bot.createMessage(msg.channel.id, toEdit + " updated successfully: " + args.join(" "));
			else
				bot.createMessage(msg.channel.id, 'An error occured setting your ' + toEdit + ' please try again.');
		}

	} catch (error) {
		console.log(error);
	}
}

//follow a user
exports.follow = async (msg, userid, bot) => {
	let isUser = await db.is_user(userid);

	if (isUser) {
		let lists = await db.get("People", msg.author.id, "Users");

		people = util.parseJSON(lists[0].People);

		if (people.Following.indexOf(userid) === -1) {
			people.Following.push(userid);

			let fin = await db.set("People", msg.author.id, "users", JSON.stringify(people));
			let res = await addFollower(msg.author.id, userid, bot);

			if (fin && res)
				bot.createMessage(msg.channel.id, 'You are now following ' + bot.users.get(userid).username);
			else
				bot.createMessage(msg.channel.id, 'An error occured attempting to follow that user');
		}
	} else {
		bot.createMessage(msg.channel.id, 'Sorry that user does not have a broadcast account');
	}
};

//called whenever a user adds to their Following list
addFollower = async (followee, userid, bot) => {
	let lists = await db.get("People", userid, "Users");
	people = util.parseJSON(lists[0].People);
	
	if (people.Followers.indexOf(followee) === -1) {
		people.Followers.push(followee);

		let fin = await db.set("People", userid, "users", JSON.stringify(people));
		
		if (fin === 1) {
			util.dmUser(userid, bot.users.get(followee).username + ' is now following you!', bot);
			return 1;
		}
		else
			return 0;
	} else {
		return 0;
	}
}

//send message to followers!
exports.send = async (msg, args, bot) => {
	let lists = await db.get('People', msg.author.id, 'Users');

	people = util.parseJSON(lists[0].People);

	for (i = 0; i < people.Followers.length; i++) {
		util.dmUser(people.Followers[i], msg.author.username + ': ' + args.join(' '), bot);
		await util.sleep(1000);
	}

	bot.createMessage(msg.channel.id, 'Message broadcasted!');
}