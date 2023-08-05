import { Client, Events, GatewayIntentBits, Collection, REST, Routes } from 'discord.js'
import { print, warn, error } from "./io.js"
import fs from "node:fs"
import path from "node:path"

const { token, clientId } = require("./config.json")

const client = new Client({intents: [GatewayIntentBits.Guilds]})
client.commands = new Collection()

const SlashCommands: JSON[] = []
const CommandsPath = path.join(__dirname, "commands")
const CommandFolders = fs.readdirSync(CommandsPath)

for (const Folder of CommandFolders) {
	const IsNotFolder = path.parse(Folder).base.match(/[.]\w+$/)
	if (!IsNotFolder) {
		const CommandFolder = path.join(CommandsPath, Folder)
		const CommandFiles = fs.readdirSync(CommandFolder).filter((file: string) => file.endsWith(".js"))
		for (const File of CommandFiles) {
			const FilePath = path.join(CommandFolder, File)
			const Command = require(FilePath)
			//Explicit
			if ("data" in Command) {
				if ("execute" in Command) {
					client.commands.set(Command.data.name, Command)
					SlashCommands.push(Command.data.toJSON())
				} else {
					warn([`The command at ${FilePath} is missing a required "execute" property.`])
				}
			} else {
				warn([`The command at ${FilePath} is missing a required "data" property.`])
			}
		}
	}
}

client.on(Events.InteractionCreate, async (interaction: any) => {
	if (interaction.isChatInputCommand()) {
		const Command = client.commands.get(interaction.commandName)
		if (Command) {
			try {
				await Command.execute(interaction)
			} catch(_error) {
				error([_error])
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({content: "The command unexpectedly threw an error.", ephemeral: true});
				} else {
					await interaction.reply({content: "The command unexpectedly threw an error.", ephemeral: true});
				}
			}
		}
	}
})

const rest = new REST().setToken(token)
const RegisterCommands = async () => {
	try {
		await rest.put(Routes.applicationCommands(clientId), {body: SlashCommands})
	} catch(_error) {
		error([_error])
	}
}
RegisterCommands()

interface Client_User {
	user: {
		tag: any
	}
}
client.once(Events.ClientReady, (c: Client_User) => {
	print([`Ready! Logged in as ${c.user.tag}`])
})

client.login(token)