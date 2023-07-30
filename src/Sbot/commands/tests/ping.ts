const { SlashCommandBuilder } = require("discord.js")

interface __interaction { 
	reply: (arg0: string) => any;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction: __interaction) {
		await interaction.reply('Shut up')
	},
}