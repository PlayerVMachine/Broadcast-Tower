const filter = require('swearjar');

const bl = require('./blacklist.json');

const matchUserMention = new RegExp('<@[0-9]{18}>');
const matchUserString = new RegExp('^[0-9]{18}');

//checks if arg is a user id or mention and returns the id if so, if not returns -1
exports.isID = (arg) => {
	if (matchUserString.test(arg))
		return arg;
	else if (matchUserMention.test(arg))
		return arg.substr(2,18);
	else
		return -1; 
}

exports.codeblockify = (text) => {
	return "```\n" + JSON.stringify(text) + "\n```";
}

exports.parseJSON = (obj) => {
    return Function('"use strict";return (' + obj + ')')();
}

exports.dmUser = async (userid, message, bot) => {
	let res = await bot.users.get(userid); //get user object
	let dmChan = await res.getDMChannel(); //get DM channel
	bot.createMessage(dmChan.id, message); //send DM
}

exports.sleep = async (ms) => {
	return new Promise(resolve => setTimeout(resolve, ms));
}

exports.isProfane = (msg, bot) => {
	rude = filter.profane(msg.content);
	badlinks = noBadLinks(msg.content);

	if(rude) {
		bot.createMessage(msg.channel.id, 'Watch your mouth, unable to send profane messages.');
		return 1;
	}

	if(badlinks) {
		bot.createMessage(msg.channel.id, 'Unable to send messages with blacklisted links. If you think this is an error report it in #whitelist-request on https://discord.gg/p3ZejvY');
		return 1;
	}

	return 0
}

noBadLinks = (message) => {
	for (i = 0; i < bl.blacklist.length; i++) {
		if (message.match(bl.blacklist[i] + '\.')){
			return 1;
		}
	}
	return 0;
}

exports.makeEmbed = (title, description, msg, color) => {
	embed =  {
            embed: {
                title: "I'm an embed!", // Title of the embed
                description: "Here is some more info, with **awesome** formatting.\nPretty *neat*, huh?",
                author: { // Author property
                    name: msg.author.username,
                    icon_url: msg.author.avatarURL
                },
                color: 0x008000, // Color, either in hex (show), or a base-10 integer
                footer: { // Footer text
                    text: "Sent through the Broadcast Tower."
                }
            }
        };

    return embed
}
