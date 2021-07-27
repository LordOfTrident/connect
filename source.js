const fs = require('fs');
const canvas = require('canvas');
const uuid = require('uuid');
const child_process = require('child_process');

const discord = require('discord.js');
const bot = new discord.Client();

bot.splitArgs = msg => {
	let argscollection = [];
	let args = [];
	let arg = "";
	let inString = false;
	let inComment = false
	let inMultiComment = false;;
	let definitiveComment = false;

	for (var i = 0; i < msg.length; ++ i) {
		for (; i < msg.length; ++ i) {
			if (msg[i] == '\n' && !inString)
				break;

			if (msg[i] == bot.ignore && !inString) {
				inComment = true;
				
				if (msg[i + 1] == bot.ignore)
					definitiveComment = true;
			};
			
			if (!inComment) { 
				if ((msg[i] == " ") && !inString) {
					args.push(arg);
					arg = "";
				} else if (msg[i] == "`") { 
					inString = !inString;

					if (msg[i + 1] == "`" && msg[i + 2] == "`")
						i += 2;
				} else 
					arg += inString? msg[i] : msg[i].toLowerCase();
			} else if (msg[i] == "`") {
				inMultiComment = !inMultiComment;
					
				if (msg[i + 1] == "`" && msg[i + 2] == "`")
					i += 2;
			};
		};

		if (arg.length != 0) {
			args.push(arg);
			arg = "";
		};

		if (args.length != 0) {
			argscollection.push(args);
			args = [];
		};

		if (!inMultiComment)
			inComment = false;
		
		if (definitiveComment)
			break;
	};

	return argscollection;
};

bot.readJSON = file => {
	return JSON.parse(fs.readFileSync(file));
};

bot.writeJSON = (file, data) => {
	fs.writeFileSync(file, JSON.stringify(data));
};

bot.createEmbed = title => {
	const attachment = new discord.MessageAttachment('./assets/clogo.png', 'logo.png');
	
	return new discord.MessageEmbed()
		.setTitle(title)
		.setColor('#ABB7DC')
		.attachFiles(attachment)
		.setThumbnail('attachment://logo.png')
		.setTimestamp()
		.setFooter('Connect');
};

bot.setOutchannel = (sid, c, id) => {
	bot.outserver = bot.guilds.cache.find(server => server.id == sid);
	
	if (id)
		bot.outchannel = bot.outserver.channels.cache.find(channel => channel.id == c);
	else
		bot.outchannel = bot.outserver.channels.cache.find(channel => channel.name == c);

	if (bot.outserver == undefined || bot.outchannel == undefined) {
		bot.outserver = bot.guilds.cache.find(server => server.id == data.outserver);
		bot.outchannel = bot.outserver.channels.cache.find(channel => channel.id == data.outchannel);;
	};
};

bot.newCommand = (fname, fdesc, fparams, fadmin, fcategory, fcallback) => {
	bot.commands.push({
		name: fname,
		desc: fdesc,
		admin: fadmin,
		params: fparams,
		category: fcategory,
		callback: fcallback
	});
};

bot.getWorkspaceIdx = userid => {
	for (var i = 0; i < bot.workspaces.length; ++ i) {
		if (bot.workspaces[i].id == userid)
			return i;
	};

	return undefined;
};

bot.addWorkspace = userid => {
	bot.workspaces.push({
		id: userid,
		image: undefined,
		canvas: undefined,
		w: 500,
		h: 500
	});
};

let data = bot.readJSON('./info.json')
bot.token = data.token;
bot.ignore = data.ignore;
bot.commands = [];
bot.workspaces = [];

bot.newCommand('setc', 'Set connected channel', [
{
	type: 's', 
	optional: false, 
	name: 'channel'
}
], true, 'Commands', (message, args) => {
	bot.outchannel.send(
		bot.createEmbed("Connecting...")
			.addFields(
				{name: "To", value: args[1]}
			)
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);

	let id = false;
	
	if (args[1].startsWith('<#')) {
		args[1] = args[1].substring(2, args[1].length - 1);

		id = true;
	};

	bot.setOutchannel(message.guild.id, args[1], id);

	bot.outchannel.send(
		bot.createEmbed("Connected")
			.addFields(
				{name: "Other", value: "*Please, be aware that everything said here is logged.*\nFor help, type in `help`."}
			)
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('setsc', 'Set connected server and channel', [
{
	type: 'i', 
	optional: false, 
	name: 'server'
},
{
	type: 'i', 
	optional: false, 
	name: 'channel'
}
], true, 'Commands', (message, args) => {
	bot.outchannel.send(
		bot.createEmbed("Connecting...")
			.addFields(
				{name: "To", value: `\`\`\`yaml\n${args[1]} in ${args[2]}\`\`\``}
			)
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);

	bot.setOutchannel(args[1], args[2], true);

	bot.outchannel.send(
		bot.createEmbed("Connected")
			.addFields(
				{name: "Other", value: "*Please, be aware that everything said here is logged.*\nFor help, type in `help`."}
			)
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('setip', 'Set ignore prefix', [
{
	type: 's', 
	optional: false, 
	name: 'prefix'
}
], true, 'Commands', (message, args) => {
	bot.ignore = args[1];
	
	bot.outchannel.send(
		bot.createEmbed("Ignore prefix set")
			.addFields(
				{name: "To", value: `\`\`\`yaml\n${bot.ignore}\`\`\``}
			)
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('quit', 'Quit the bot', [], true, 'Commands', async (message, args) => {
	if (bot.quitlock && message.author.id != 458280808482996234) {
		bot.outchannel.send(
			bot.createEmbed("Oopsie!")
				.setDescription('Sorry, the quit command was locked by the bot owner!')
				.setFooter(`Requested by ${message.member.user.tag} | Connect`)
		);

		return;
	};
	
	await bot.outchannel.send(
		bot.createEmbed("Quitting...")
			.setDescription("Goodbye!")
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);

	process.exit();
});

bot.newCommand('quitlock', 'Lock/unlock the quit command', [], true, 'Commands', async (message, args) => {
	if (message.author.id != 458280808482996234) {
		bot.outchannel.send(
			bot.createEmbed("Oopsie!")
				.setDescription('Sorry, only the bot owner is allowed to run this command!')
				.setFooter(`Requested by ${message.member.user.tag} | Connect`)
		);

		return;
	};

	bot.quitlock = !bot.quitlock;

	if (bot.quitlock) {
		bot.outchannel.send(
			bot.createEmbed("Quit locked")
				.setDescription("The quit command was locked.")
				.setFooter(`Requested by ${message.member.user.tag} | Connect`)
		);

		return;
	};

	bot.outchannel.send(
		bot.createEmbed("Quit unlocked")
			.setDescription("The quit command was unlocked.")
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('ignore', 'Make the bot ignore everyone', [], true, 'Commands', (message, args) => {
	if (message.author.id != 458280808482996234) {
		bot.outchannel.send(
			bot.createEmbed("Oopsie!")
				.setDescription('Only the owner is allowed to run this command!')
				.setFooter(`Requested by ${message.member.user.tag} | Connect`)
		);
	
		return;
	};
	
	bot.ignoring = !bot.ignoring;

	bot.outchannel.send(
		bot.createEmbed("Ignoring enabled")
			.setDescription('The bot will now ignore all messages except the owners!')
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('oneline', 'Make the bot run only one line', [], true, 'Commands', (message, args) => {
	if (message.author.id != 458280808482996234) {
		bot.outchannel.send(
			bot.createEmbed("Oopsie!")
				.setDescription('Only the owner is allowed to run this command!')
				.setFooter(`Requested by ${message.member.user.tag} | Connect`)
		);
	
		return;
	};
	
	bot.shut = !bot.shut;

	bot.outchannel.send(
		bot.createEmbed("One line")
			.setDescription(bot.shut? 'I will only read one line.' : 'I will read multiple lines.')
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('ping', 'Bot ping stats', [], false, 'Commands', (message, args) => {	
	let latency = Date.now() - message.createdTimestamp;
	let apilatency = Math.round(bot.ws.ping);

	bot.outchannel.send(
		bot.createEmbed("Ping")
			.addFields(
				{name: 'Latency', value: `\`\`\`yaml\n${latency}\`\`\``},
				{name: 'API Latency', value: `\`\`\`yaml\n${apilatency}\`\`\``}
			)
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('randid', 'Generate a random ID', [], false, 'Commands', (message, args) => {
	const randchoice = Math.floor(Math.random() * 2);
	var randid;

	if (randchoice == 1) 
		randid = uuid.v1();
	else 
		randid = uuid.v4();
	
	bot.outchannel.send(
		bot.createEmbed("Generated a random ID")
			.addFields(
			    {name: 'ID', value: `\`\`\`yaml\n${randid}\`\`\`\n**ID Version** \`${uuid.version(randid)}\``}
			)
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('servers', 'Show the amount of servers the bot is in', [], false, 'Commands', (message, args) => {	
	bot.outchannel.send(
		bot.createEmbed("Server count")
			.setDescription(`\`\`\`yaml\n${bot.guilds.cache.size}\`\`\``)
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('profile', 'Show users profile', [
{
	type: 's', 
	optional: true, 
	name: 'usermention'
}
], false, 'Commands', (message, args) => {
	let muser = message.author;
	
	if (args.length == 2)
		muser = message.mentions.users.first();

	if (muser == undefined) {
		bot.outchannel.send(
			bot.createEmbed("Oopsie!")
				.setDescription('You need to mention a user!')
				.setFooter(`Requested by ${message.member.user.tag} | Connect`)
		);

		return;
	};

	let user = bot.users.cache.find(user => user.id == muser.id);
	if (user == undefined)
		user = bot.users.cache.find(user => user.id == muser.id);
		
	const usertag = user == undefined? "" : user.tag; 

	const userJoinDate = bot.users.cache.find(user => user.id == muser.id).createdAt;
    const userAvatar = bot.users.cache.find(user => user.id == muser.id).avatarURL();

	bot.outchannel.send(
		bot.createEmbed('Profile of ' + usertag)
			.setImage(userAvatar)
			.addFields(
				{name: 'Name', value: `\`\`\`yaml\n${usertag}\`\`\``},
				{name: 'ID', value: `\`\`\`yaml\n${muser.id}\`\`\``},
				{name: 'Join Date', value: `\`\`\`yaml\n${userJoinDate}\`\`\``},
				{name: 'Is A Bot', value: `\`\`\`yaml\n${muser.bot}\`\`\``},
				{name: 'Avatar', value: '[```yaml\n' + userAvatar + '```](' + userAvatar + ')'}
			)
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('img-show', 'Display your image', [], false, 'Images', (message, args) => {
	const attachment = new discord.MessageAttachment(`workspaces/images/${message.author.id}.jpg`, 'img.png');

	bot.outchannel.send(
		bot.createEmbed("Image display")
			.setDescription('Dont forget that the image has to be saved with `img-save` in order to be displayed!')
			.attachFiles(attachment)
			.setImage('attachment://img.png')
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('img-save', 'Save your image', [], false, 'Images', (message, args) => {
	const idx = bot.getWorkspaceIdx(message.author.id);
	const buf = bot.workspaces[idx].image.toBuffer('image/jpeg', {quality: 1});	
	fs.writeFileSync(`workspaces/images/${message.author.id}.jpg`, buf);	

	bot.outchannel.send(
		bot.createEmbed("Image saved")
			.setDescription('Your image was saved! You can now use `img-show` to display it.')
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('img-saveshow', 'Save and display your image', [], false, 'Images', (message, args) => {
	const idx = bot.getWorkspaceIdx(message.author.id);
	const buf = bot.workspaces[idx].image.toBuffer('image/jpeg', {quality: 1});	
	fs.writeFileSync(`workspaces/images/${message.author.id}.jpg`, buf);
	
	const attachment = new discord.MessageAttachment(`workspaces/images/${message.author.id}.jpg`, 'img.png');

	bot.outchannel.send(
		bot.createEmbed("Image display")
			.setDescription('Image saved.')
			.attachFiles(attachment)
			.setImage('attachment://img.png')
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('img-clear', 'Clear your image', [], false, 'Images', (message, args) => {
	const idx = bot.getWorkspaceIdx(message.author.id);	
	const ctx = bot.workspaces[idx].canvas;
	
	ctx.fillStyle = `rgba(255,255,255,1)`;
	ctx.fillRect(0, 0, bot.workspaces[idx].w, bot.workspaces[idx].h);

	bot.outchannel.send(
		bot.createEmbed("Image cleared")
			.setDescription('Your image was cleared!')
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('img-new', 'Create a new image', [
{
	type: 'i', 
	optional: false, 
	name: 'width'
},
{
	type: 'i', 
	optional: false, 
	name: 'height'
}
], false, 'Images', (message, args) => {
	if (args[1] > 1200)
		args[1] = 1200;
	
	if (args[2] > 1200)
		args[2] = 1200;
	
	const w = args[1];
	const h = args[2];
		
	const idx = bot.getWorkspaceIdx(message.author.id);	
	
	bot.workspaces[idx].image = canvas.createCanvas(w, h);
	bot.workspaces[idx].canvas = bot.workspaces[idx].image.getContext('2d');
	
	const ctx = bot.workspaces[idx].canvas;
	
	ctx.fillStyle = `rgba(255,255,255,1)`;
	ctx.fillRect(0, 0, bot.workspaces[idx].w, bot.workspaces[idx].h);

	bot.outchannel.send(
		bot.createEmbed("Image created")
			.setDescription(`An image with the size of \`${w};${h}\``)
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('img-drawline', 'Draw a line on your image', [
{
	type: 'i', 
	optional: false, 
	name: 'posx'
},
{
	type: 'i', 
	optional: false, 
	name: 'posy'
},
{
	type: 'i', 
	optional: false, 
	name: 'posx2'
},
{
	type: 'i', 
	optional: false, 
	name: 'posy2'
},
{
	type: 'i', 
	optional: false, 
	name: 'red'
},
{
	type: 'i', 
	optional: false, 
	name: 'green'
},
{
	type: 'i', 
	optional: false, 
	name: 'blue'
},
{
	type: 'i', 
	optional: true, 
	name: 'oopacity'
}
], false, 'Images', (message, args) => {
	const x1 = args[1];
	const y1 = args[2];
	const x2 = args[3];
	const y2 = args[4];
	
	const r = args[5];
	const g = args[6];
	const b = args[7];

	let a = 1;

	if (args.length == 9)
		a = args[8] / 255;

	const idx = bot.getWorkspaceIdx(message.author.id);	
	const ctx = bot.workspaces[idx].canvas;
	
	ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
	ctx.beginPath();
	ctx.lineTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();	

	bot.outchannel.send(
		bot.createEmbed("Drawn a line")
			.setDescription(`A line from \`${x1};${y1}\` to \`${x2};${y2}\` by the color \`${r};${g};${b}\` was drawn!`)
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('img-drawrect', 'Draw a rectangle on your image', [
{
	type: 'i', 
	optional: false, 
	name: 'posx'
},
{
	type: 'i', 
	optional: false, 
	name: 'posx'
},
{
	type: 'i', 
	optional: false, 
	name: 'width'
},
{
	type: 'i', 
	optional: false, 
	name: 'height'
},
{
	type: 'i', 
	optional: false, 
	name: 'red'
},
{
	type: 'i', 
	optional: false, 
	name: 'green'
},
{
	type: 'i', 
	optional: false, 
	name: 'blue'
},
{
	type: 'i', 
	optional: true, 
	name: 'opacity'
}
], false, 'Images', (message, args) => {
	const x1 = args[1];
	const y1 = args[2];
	const x2 = args[3];
	const y2 = args[4];
	
	const r = args[5];
	const g = args[6];
	const b = args[7];
	
	let a = 1;
	
	if (args.length == 9)
		a = args[8] / 255;

	const idx = bot.getWorkspaceIdx(message.author.id);	
	const ctx = bot.workspaces[idx].canvas;
	
	ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
	ctx.fillRect(x1, y1, x2, y2);

	bot.outchannel.send(
		bot.createEmbed("Drawn a line")
			.setDescription(`A rectangle from \`${x1};${y1}\` to \`${x2};${y2}\` by the color \`${r};${g};${b}\` was drawn!`)
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('img-drawtext', 'Draw text on your image', [
{
	type: 'i', 
	optional: false, 
	name: 'posx'
},
{
	type: 'i', 
	optional: false, 
	name: 'posy'
},
{
	type: 'i', 
	optional: false, 
	name: 'red'
},
{
	type: 'i', 
	optional: false, 
	name: 'green'
},
{
	type: 'i', 
	optional: false, 
	name: 'blue'
},
{
	type: 's', 
	optional: false, 
	name: 'text'
},
{
	type: 'i', 
	optional: true, 
	name: 'opacity'
},
{
	type: 's', 
	optional: false, 
	name: 'font'
}
], false, 'Images', (message, args) => {
	const x = args[1];
	const size = args[3];
	const y = args[2] + size;
	
	const r = args[4];
	const g = args[5];
	const b = args[6];
	const text = args[7];

	let a = 1;
	let font = "Default";
	
	if (args.length > 8)
		a = args[8] / 255;
	
	if (args.length == 10)
		font = args[9];

	const idx = bot.getWorkspaceIdx(message.author.id);	
	const ctx = bot.workspaces[idx].canvas;

	ctx.font = `${size}px ${font}`;
	ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
	ctx.fillText(text, x, y);

	bot.outchannel.send(
		bot.createEmbed("Drawn text")
			.setDescription(`Text at \`${x};${y}\` by the size \`${size}\` and color \`${r};${g};${b}\` was drawn!`)
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('img-loadforeign', 'Load an image into your image', [
{
	type: 'i', 
	optional: false, 
	name: 'posx'
},
{
	type: 'i', 
	optional: false, 
	name: 'posy'
},
{
	type: 'i', 
	optional: false, 
	name: 'width'
},
{
	type: 'i', 
	optional: false, 
	name: 'height'
},
{
	type: 's', 
	optional: false, 
	name: 'url'
}
], false, 'Images', async (message, args) => {
	const x1 = args[1];
	const y1 = args[2];
	const x2 = args[3];
	const y2 = args[4];
	
	const url = args[5];

	const idx = bot.getWorkspaceIdx(message.author.id);	
	const ctx = bot.workspaces[idx].canvas;

	let image;
	
	try {
		image = await canvas.loadImage(url);
	} catch {
		bot.outchannel.send(
			bot.createEmbed("Oopsie!")
				.setDescription('There was an error when loading the image.')
				.setFooter(`Requested by ${message.member.user.tag} | Connect`)
		);
		
		return;
	};
	
	ctx.drawImage(image, x1, y1, x2, y2);
	
	bot.outchannel.send(
		bot.createEmbed("Image loaded")
			.setDescription(`Image was loaded at \`${x1};${y1}\` by the size \`${x2};${y2}\``)
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

bot.newCommand('scbl', 'Execute SCBL code', [
{
	type: 's', 
	optional: false, 
	name: 'code'
}
], false, 'Coding', (message, args) => {
	fs.writeFileSync('./compilers/main.scbl', args[1]);
	  
	process = child_process.spawnSync('./compilers/scbl', ['./compilers/main.scbl'])
	const stdout = process.stdout;
	const exitcode = process.status;
	
	const attachment = new discord.MessageAttachment('compilers/scbl.png', 'img.png');
	
	bot.outchannel.send(
		new discord.MessageEmbed()
			.setTitle("SCBL Code executed")
			.setColor('#788191')
			.attachFiles(attachment)
			.setThumbnail('attachment://img.png')
			.setTimestamp()
			.setFooter('Connect')
			.addFields(
				{name: 'Code', value: '```lua\n' + args[1] + '```'},
				{name: 'Output', value: '```yaml\n' + stdout + ' ```\n**Exitcode** `' + exitcode + '`'}
			)
			.setFooter(`Requested by ${message.member.user.tag} | Connect`)
	);
});

process.on('exit', () => {
	console.log('Ended.');
	bot.writeJSON('./info.json', {
		token: bot.token,
		ignore: bot.ignore,
		outserver: bot.outserver.id,
		outchannel: bot.outchannel.id,
		quitlock: bot.quitlock
	});
});

bot.on('ready', () => {
	bot.outserver = bot.guilds.cache.find(server => server.id == data.outserver);
	bot.outchannel = bot.outserver.channels.cache.find(channel => channel.id == data.outchannel);
	bot.quitlock = data.quitlock;
	bot.ignoring = false;
	bot.shut = false;

	bot.user.setActivity('commands to execute', {type: 'LISTENING'});	
	
	if (bot.outchannel == undefined) {
		console.log('ERROR: Default connected channel is undefined!')

		process.exit();
	};

	bot.outchannel.send(
		bot.createEmbed("Connect ready").addFields(
			{name: "Credits", value: "Made by `LordOfTrident` (Reinhold A. B.)"},
			{name: "Other", value: "*Please, be aware that everything said here is logged.*\nFor help, type in `help`."}
		)
	);

	console.log('Bot is on!');
});


bot.on('message', async message => {
	if (bot.ignoring && message.author.id != 458280808482996234)
		return;
	
	if (message.author.id == bot.user.id)
		return;
	
	let user = bot.users.cache.find(user => user.id == message.author.id);
	if (user == undefined)
		user = bot.users.cache.find(user => user.id == message.author.id);
		
	const userTag = user == undefined? "" : user.tag; 
	const log = `[S: ${message.guild.id}, C: ${message.channel.id}, U: ${message.author.id} | ${userTag}]: ${message.content}`;

	console.log(log);
	fs.appendFileSync('logs.txt', `${log}\n`);
	
	if (message.author.bot || message.channel != bot.outchannel)
		return;

	let idx = bot.getWorkspaceIdx(message.author.id);
	if (idx == undefined) {
		bot.addWorkspace(message.author.id);

		if (!fs.existsSync(`workspaces/images/${message.author.id}.jpg`)) {
			let img = fs.readFileSync('workspaces/images/template.jpg');
			fs.writeFileSync(`workspaces/images/${message.author.id}.jpg`, img);
		};

		idx = bot.getWorkspaceIdx(message.author.id);
		
		const image = await canvas.loadImage(`workspaces/images/${message.author.id}.jpg`);
				
		bot.workspaces[idx].image = canvas.createCanvas(image.width, image.height);
		bot.workspaces[idx].canvas = bot.workspaces[idx].image.getContext('2d');

		bot.workspaces[idx].canvas.drawImage(image, 0, 0, image.width, image.height);
	};

	let isAdmin = false;

	if (message.member.hasPermission("ADMINISTRATOR") || message.author.id == 458280808482996234)
		isAdmin = true;

	let args = bot.splitArgs(message.content);
	let msgcontents = message.content;

	for (var i = 0; i < args.length; ++ i) {
		message.content = msgcontents.split('\n')[i];
		bot.readMsg(message, args[i], user, userTag, isAdmin);
		
		if (bot.shut)
			return;
	};
});

bot.readMsg = async (message, args, user, userTag, isAdmin) => {
	if (args[0] == 'help') {
		if (args.length > 1) {
			switch (args[1]) {
				case 'cmds': case 'commands': {
					let categories = [
						{
							name: "Commands",
							commands: "`help [s:category]` - Bot help menu\n"
						},
						{
							name: "Admin-only",
							commands: ""
						}
					];

					for (var i = 0; i < bot.commands.length; ++ i) {
						let found = false;
						for (var j = 0; j < categories.length; ++ j) {
							if (bot.commands[i].category == categories[j].name) {
								found = true;

								break;
							};
						};

						if (!found) {
							categories.push({
								name: bot.commands[i].category,
								commands: ""
							});
						};
					};

					for (var i = 0; i < bot.commands.length; ++ i) {
						let params = '';
						
						for (var j = 0; j < bot.commands[i].params.length; ++ j) {
							params += bot.commands[i].params[j].optional? '[' : '<';

							params += bot.commands[i].params[j].type + ':';
							params += bot.commands[i].params[j].name;
							
							params += bot.commands[i].params[j].optional? '] ' : '> ';
						};

						let cmd = `\`${bot.commands[i].name} ${params}\` - ${bot.commands[i].desc}\n`;
						
						if (bot.commands[i].admin) {
							categories[1].commands += cmd;

							continue;
						};
						
						for (var j = 0; j < categories.length; ++ j) {
							if (bot.commands[i].category == categories[j].name) {
								categories[j].commands += cmd;

								break;
							};
						};
					};

					let embed = bot.createEmbed("Help: commands")
						.setDescription('`s:` - String parameter, starts and ends with a \\`\n`i:` - Integer parameter, a whole number\n`<>` - Required parameter\n`[]` - Optional parameter')
						.setFooter(`Requested by ${userTag} | Connect`)
						.addFields(
							{name: 'Commands', value: categories[0].commands}
						);

					for (var i = 2; i < categories.length; ++ i) {
						embed.addFields(
							{name: categories[i].name, value: categories[i].commands}
						);
					};
					
					embed.addFields(
						{name: 'Admin-only', value: categories[1].commands}
					);

					bot.outchannel.send(embed);

					break;
				};

				case 'structure': {
					bot.outchannel.send(
						bot.createEmbed("Help: structure")
							.addFields(
								{name: 'Comments', value: 'Comments start with a `' + bot.ignore + '` and end at the end of the line. If you want to comment out the entire rest of the message, use `' + bot.ignore + bot.ignore + '`'},
								{name: 'Commands', value: 'The command structure is very simple:```yaml\n<command> <parameters>```You can run multiple commands in one message by putting them in new lines.'},
								{name: 'Strings', value: 'A string starts and ends with a backtick but if you want to type that character in a string or make a multi line strings, you need to type three backticks on both sides. Examples: ```yaml\n\u200B`This is a one-line string!`\u200B``````yaml\n\u200B`\u200B`\u200B`Hello!\nThis is a multi-line string!`\u200B`\u200B`\u200B```'}
							)
							.setFooter(`Requested by ${userTag} | Connect`)
					);

					break;
				};

				default: {
					bot.outchannel.send(
						bot.createEmbed("Oopsie!")
							.setDescription(`'${args[1]}' is an unknown help category! Type in \`help\` to see all the available categories.`)
							.setFooter(`Requested by ${userTag} | Connect`)
					);

					break;
				};
			};

			return;
		};

		bot.outchannel.send(
			bot.createEmbed("Help")
				.addFields(
					{name: "Categories", value: "`commands` - List of all commands\n`structure` - Bot command structure explanation"},
					{name: "Others", value: `Type \`${bot.ignore}${bot.ignore}\` at the start of your message for the bot to ignore it!`}
				)
				.setFooter(`Requested by ${userTag} | Connect`)
		);

		return;
	};

	for (var i = 0; i < bot.commands.length; ++ i) {
		if (args[0] == bot.commands[i].name) {
			if (bot.commands[i].admin && !isAdmin) {
				bot.outchannel.send(
					bot.createEmbed("Oopsie!")
						.setDescription(`Looks like you do not have the permission to run this command as its admin-only!`)
						.setFooter(`Requested by ${userTag} | Connect`)
				);

				return;
			};

			let optionalparams = [];
			let requiredparams = [];

			for (var j = 0; j < bot.commands[i].params.length; ++ j) {
				if (bot.commands[i].params[j].optional)
					optionalparams.push(bot.commands[i].params[j]);
				else
					requiredparams.push(bot.commands[i].params[j]);
			};

			const alength = args.length - 1;
			const rlength = requiredparams.length;
			const olength = optionalparams.length;
			
			if (!((alength >= rlength) && (alength <= rlength + olength))) {
				bot.outchannel.send(
					bot.createEmbed("Oopsie!")
						.setDescription(`This command has ${rlength + olength} parameter${(rlength + olength == 1)? '' : "s"}!`)
						.setFooter(`Requested by ${message.member.user.tag} | Connect`)
				);
			
				return;
			};

			for (var j = 0; j < optionalparams.length; ++ j)
				requiredparams.push(optionalparams[j]);

			for (var j = 1; j < args.length; ++ j) {
				if (requiredparams[j - 1].type == 'i') {
					args[j] = parseInt(args[j]);

					if (args[j] == NaN) {
						bot.outchannel.send(
							bot.createEmbed("Oopsie!")
								.setDescription('There was a problem parsing integer parameters! are you sure you specified whole numbers?')
								.setFooter(`Requested by ${message.member.user.tag} | Connect`)
						);
					
						return;
					};
				};
			};
			
			bot.commands[i].callback(message, args);
		
			return;
		};
	};

	bot.outchannel.send(
		bot.createEmbed("Oopsie!")
			.setDescription(`'${args[0]}' is an unknown command! Type in \`help commands\` to see all the available commands.`)
			.setFooter(`Requested by ${userTag} | Connect`)
	);
};

bot.login(bot.token);
