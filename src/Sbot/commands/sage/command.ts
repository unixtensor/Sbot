import { SlashCommandBuilder } from "discord.js"
import { print } from "../../io.js"
import { InteractionType } from "../../@types/discordjs.js"
import SageService from "../_lib/sagemath/src.js"
import { MessageParser } from "../_lib/parseOutput.js"

let AnswerQueue: boolean = false

const SageMessageReply = (i: string, o: string): string => {
	const ParsedVersion = new MessageParser(SageService.Version())
	const ParsedInput = new MessageParser(i)
	const ParsedResult = new MessageParser("= "+o)
	return `Using: ${ParsedVersion.CodeBlock()}\nOutput of ${ParsedInput.CodeBlock()}:\n${ParsedResult.CodeBlockMultiLine("asciidoc")}`
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("sage")
		.setDescription("Open a SageMath kernel instance and run SageMath code (Python input).")
		.addStringOption(o => o.setName("input").setDescription("Python input, check SageMath docs for more info. / https://www.sagemath.org/help.html").setRequired(true)),
	async execute(interaction: InteractionType) {
		if (!AnswerQueue) {
			AnswerQueue = true
			const input = interaction.options.getString("input")
			print(["SageMath command started", "input=", input])

			SageService.ResultParsed.once("failed", (error: Error | string) => {
				
			})
			SageService.ResultParsed.once("result", async (Data: string, IsFile: boolean) => {
				await interaction.reply(SageMessageReply(input, Data))

				print(["SageMath command data:", "Data=", Data, "IsFile=", IsFile])
				AnswerQueue = false
			})
			SageService.Kernel.stdin.write(input+"\n")
		} else {
			//TODO: make a command only for administrators to force a new sage instance?
			setTimeout(() => AnswerQueue = false, 5000)
			await interaction.reply("Please wait, another Sage instance is present.")
		}
	},
}