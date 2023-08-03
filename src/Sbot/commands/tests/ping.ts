const { SlashCommandBuilder } = require("discord.js")

const Silly: string[] = [
	"Shut up",
	"Ok."
]

interface __interaction { 
	reply: (arg0: string) => any
}
module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Test the bot with a ping.'),
	async execute(interaction: __interaction) {
		await interaction.reply(Silly[Math.round(Math.random()*(Silly.length-1))])
	},
}