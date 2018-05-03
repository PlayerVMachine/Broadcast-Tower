const filter = require('swearjar');

const bl = require('./blacklist.json');

//match user mentions and id strings
const matchUserMention = new RegExp('<@[0-9]{18}>');
const matchUserString = new RegExp('^[0-9]{18}');

//checks if arg is an id or mention and returns the id if so, if not returns -1
exports.isID = (arg) => {
	if (matchUserString.test(arg))
		return arg;
	else if (matchUserMention.test(arg))
		return arg.substr(2,18);
	else
		return -1; 
}

exports.codeblockify = (data) => {
	if (typeof(data) === 'object')
		return "```\n" + JSON.stringify(data) + "\n```";
	else
		return "```\n" + data + "\n```";
}

exports.getUserObj = async (userid) => {
	let user = await bot.users.get(userid);
	return user;
}

exports.sleep = async (ms) => {
	return new Promise(resolve => setTimeout(resolve, ms));
}

exports.profileEmbed = (doc) => {
	let user = self.getUserObj(doc.user);

	embed = {
		embed: {
			title: user.username, // Title of the embed
			description: doc.bio,
            author: { // Author property
                name: user.username,
                icon_url: user.avatarURL
            },
            color: doc.eColor, // Color, either in hex (show), or a base-10 integer
            fields: [ // Array of field objects
            	{
                	name: "Tagline: ", // Field title
                    value: doc.tagline, // Field
                    inline: true // Whether you want multiple fields in same line
                },
                {
                	name: "Followers: ",
                	value: doc.followers.length,
                	inline: true
                },
                {
                	name: "Following: ",
                	value: doc.following.length,
                	inline: true
                }
            ],
            footer: { // Footer text
                	text: "Broadcast Tower User Card"
            }
       	}
    }

    return embed;
}

exports.postEmbed = (msg) => {
	embed = {
		embed: {
			title: muser.username, // Title of the embed
			description: doc.bio,
            author: { // Author property
                name: user.username,
                icon_url: user.avatarURL
            },
            color: doc.eColor,
            footer: { // Footer text
            	text: "Report abuse to [Dave]"
            }
       	}
    }

    return embed;
}

exports.rand4Digit = () => {
  min = Math.ceil(1000);
  max = Math.floor(9999);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}