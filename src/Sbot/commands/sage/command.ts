// Sbot
// @interpreterK - GitHub
// 2023

import { AttachmentBuilder, SlashCommandBuilder, codeBlock } from "discord.js"
import { print } from "../../io.js"
import SageService from "../_lib/sagemath/src.js"
import MessageParser from "../_lib/ParseOutput.js"
import MaxStrOut from "../_lib/MaxOutManager.js"

const Forbidden_Commands: string[] = [
	"quit"
]
let AnswerQueue: boolean = false

const SageMessageVersion = (): string => {
	const ParsedVersion = new MessageParser(SageService.Version())
	return `Using: ${ParsedVersion.CodeBlock()}\n`
}

const SageMessageReply = (i: string, o?: string): string => {
	const ParsedInput = new MessageParser(i)
	let ParsedString = `${SageMessageVersion()}Output of ${ParsedInput.CodeBlock()}:`
	if (o) {
		const ParsedResult = new MessageParser("= "+o)
		ParsedString = ParsedString+`\n${ParsedResult.CodeBlockMultiLine("asciidoc")}`
	}
	return ParsedString
}

const CommandAllowed = (Input: string): boolean => {
	let Pass: boolean = true
	for (let i=0; i<Forbidden_Commands.length; ++i) {
		if (Input.toLowerCase() == Forbidden_Commands[i].toLowerCase()) {
			print(["SageMath, blacklisted command was inputted =", Input])
			Pass = false
			break
		}
	}
	return Pass
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("sage")
		.setDescription("Open a SageMath kernel instance and run SageMath code (Python input).")
		.addStringOption(o => o.setName("input").setDescription("Python input, check SageMath docs for more info. / https://www.sagemath.org/help.html").setRequired(true)),
	async execute(interaction: any) {
		if (!AnswerQueue) {
			AnswerQueue = true
			const Input: string = interaction.options.getString("input")
			print(["SageMath command started input=", Input])

			if (!CommandAllowed(Input)) {
				const ParsedNotAllowed = new MessageParser(Input)
				const ParsedCodeBlock = ParsedNotAllowed.CodeBlock()
				await interaction.reply(MaxStrOut(SageMessageVersion()+`The command ${ParsedCodeBlock} is not allowed in this context.`), ParsedCodeBlock)
				AnswerQueue = false
			} else {
				//Start a new Sage stdin and stdout instance
				new SageService().new(Input)

				SageService.ResultParsed.once("failed", async (FailReason: string) => {
					const ParsedFailReason = new MessageParser(FailReason)
					const ParsedFailBlock = ParsedFailReason.CodeBlockMultiLine()
					await interaction.reply(MaxStrOut(SageMessageVersion()+`Sage errored, this is mostly likely a problem with my internal programming.\nError status: ${ParsedFailBlock}`, ParsedFailBlock))
					AnswerQueue = false
				})

				SageService.ResultParsed.once("result", async (Data: string, IsFile: boolean, FileLocation: string) => {
					if (IsFile) {
						const Image = new AttachmentBuilder(FileLocation)
						await interaction.reply(MaxStrOut(SageMessageReply(Data)), {files: [Image]})
					} else {
						await interaction.reply(MaxStrOut(SageMessageReply(Input, Data), Data))
					}
					print(["SageMath command data:", "Data=", Data, "IsFile=", IsFile])
					AnswerQueue = false
				})

				setTimeout(() => AnswerQueue = false, 5000)
			}
		} else {
			//TODO: make a command only for administrators to force a new sage instance?
			setTimeout(() => AnswerQueue = false, 5000)
			await interaction.reply("Please wait, another SageMath instance is present.")
		}
	},
}