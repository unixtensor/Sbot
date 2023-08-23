// Sbot
// @interpreterK - GitHub
// 2023

import { SlashCommandBuilder } from "discord.js"

const Silly: string[] = [
	"Shut up",
	"Ok."
]

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Test the bot with a ping."),
	async execute(interaction: any) {
		await interaction.reply(Silly[Math.round(Math.random()*(Silly.length-1))])
	},
}