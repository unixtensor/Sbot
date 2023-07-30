const { Client, Events, GatewayIntentBits, Collection } = require('discord.js')
const { token }       		 = require("../config.json")
const { print, warn, error } = require("./io")

const fs   = require("node:fs")
const path = require("node:path")

const client = new Client({intents: [GatewayIntentBits.Guilds]})
client.commands = new Collection()
client.on(Events.InteractionCreate, async (interaction: any) => {
	if (interaction.isChatInputCommand()) {
		const Command = interaction.client.commands.get(interaction.commandName)
		if (Command) {
			try {
				await Command.execute(interaction)
			} catch(_error) {
				error(_error)
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({
						content: "The command threw an error.",
						ephemeral: true
					})
				} else {
					await interaction.reply({
						content: "The command threw an error.",
						ephemeral: true
					})
				}
			}
		} else {
			warn(`Command ${interaction.commandName} does not exist.`)
		}
	}
})

const CommandsPath = path.join(__dirname, "commands")
const CommandFolders = fs.readdirSync(CommandsPath)

for (const Folder of CommandFolders) {
	const CommandFolder = path.join(CommandsPath, Folder)
	const CommandFiles = fs.readdirSync(CommandFolder).filter((file: string) => file.endsWith(".js"))
	for (const File of CommandFiles) {
		const FilePath = path.join(CommandsPath, File)
		const Command = require(FilePath)
		if ("data" in Command && "execute" in Command) {
			client.commands.set(Command.data.name, Command)
		} else {
			warn(`The command at ${FilePath} is missing a required "data" or "execute" property.`)
		}	
	}
}

interface Client_User {
	user: {
		tag: any
	}
}
client.once(Events.ClientReady, (c: Client_User) => {
	print(`Ready! Logged in as ${c.user.tag}`)
})

client.login(token)