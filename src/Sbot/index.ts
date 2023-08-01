const { Client, Events, GatewayIntentBits, Collection, REST, Routes } = require('discord.js')
const { token, clientId, guildId } = require("../config.json")
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

const Commands: JSON[] = []
const CommandsPath = path.join(__dirname, "commands")
const CommandFolders = fs.readdirSync(CommandsPath)

for (const Folder of CommandFolders) {
	const CommandFolder = path.join(CommandsPath, Folder)
	const CommandFiles = fs.readdirSync(CommandFolder).filter((file: string) => file.endsWith(".js"))
	for (const File of CommandFiles) {
		const FilePath = path.join(CommandFolder, File)
		const Command = require(FilePath)
		//Explicit
		if ("data" in Command) {
			if ("execute" in Command) {
				Commands.push(Command.data.toJSON())
			} else {
				warn(`The command at ${FilePath} is missing a required "execute" property.`)
			}
		} else {
			warn(`The command at ${FilePath} is missing a required "data" property.`)
		}
	}
}

const rest = new REST().setToken(token)
const CommandRegister = async () => {
	try {
		print(`Started refreshing ${Commands.length} application (/) commands.`)
		const Data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), {body: Commands})
		print(`Successfully reloaded ${Data.length} application (/) commands.`);
	} catch(_error) {
		error(_error)
	}
}
CommandRegister()

interface Client_User {
	user: {
		tag: any
	}
}
client.once(Events.ClientReady, (c: Client_User) => {
	print(`Ready! Logged in as ${c.user.tag}`)
})

client.login(token)