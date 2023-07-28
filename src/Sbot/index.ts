const { Client, Events, GatewayIntentBits } = require('discord.js')
const { token } = require("../config.json")
const { print } = require("./logging")

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

interface Client_User {
	user: {
		tag: any
	}
}

client.once(Events.ClientReady, (c: Client_User) => {
	print(`Ready! Logged in as ${c.user.tag}`)
})

client.login(token)