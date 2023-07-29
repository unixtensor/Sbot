const { Client, Events, GatewayIntentBits, Collection } = require('discord.js')
const { token } = require("../config.json")
const { print, warn } = require("./io")

const fs   = require("node:fs")
const path = require("node:path")

const client = new Client({intents: [GatewayIntentBits.Guilds]})
client.commands = new Collection()

//Just type the cringe, just type it... it *wont* last forever...
//...but it can hurt you;
const CommandsPath = path.join(__dirname, "commands")
const CommandFiles = fs.readdirSync(CommandsPath).filter((file: string) => file.endsWith(".js"))

for (const File of CommandFiles) {
	const FilePath = path.join(CommandsPath, File)
	const Command = require(FilePath)
	if ("data" in Command && "execute" in Command) {
		client.commands.set(Command)
	} else {
		warn(`The command at ${FilePath} is missing a required "data" or "execute" property.`)
	}
}
//--

interface Client_User {
	user: {
		tag: any
	}
}

client.once(Events.ClientReady, (c: Client_User) => {
	print(`Ready! Logged in as ${c.user.tag}`)
})

client.login(token)
