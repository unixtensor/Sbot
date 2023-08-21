// Sbot
// @interpreterK - GitHub
// 2023

import { SlashCommandBuilder } from "discord.js"
import { InteractionType } from "../../@types/discordjs"

const Silly: string[] = [
	"Shut up",
	"Ok."
]

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Test the bot with a ping."),
	async execute(interaction: InteractionType) {
		await interaction.reply(Silly[Math.round(Math.random()*(Silly.length-1))])
	},
}