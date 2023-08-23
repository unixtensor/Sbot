import { AttachmentBuilder, SlashCommandBuilder } from "discord.js"
import { print } from "../../io.js"
import SageService from "../_lib/sagemath/src.js"
import { MessageParser } from "../_lib/parseOutput.js"

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
			const input: string = interaction.options.getString("input")
			print(["SageMath command started input=", input])

			if (!CommandAllowed(input)) {
				const ParsedNotAllowed = new MessageParser(input)
				await interaction.reply(SageMessageVersion()+`The command ${ParsedNotAllowed.CodeBlock()} is not allowed in this context.`)
				AnswerQueue = false
			} else {
				SageService.ResultParsed.once("failed", async (FailReason: string) => {
					const ParsedFailReason = new MessageParser(FailReason)
					await interaction.reply(SageMessageVersion()+`Sage errored, this is mostly likely a problem with my internal programming.\nError status: ${ParsedFailReason.CodeBlockMultiLine()}`)
					AnswerQueue = false
				})
				SageService.ResultParsed.once("result", async (Data: string[], IsFile: boolean) => {
					if (IsFile) {
						const Image = new AttachmentBuilder(Data[0])
						await interaction.reply(SageMessageReply(Data), {files: [Image]})
					} else {
						await interaction.reply(SageMessageReply(input, Data))
					}
					print(["SageMath command data:", "Data=", Data, "IsFile=", IsFile])
					AnswerQueue = false
				})

				SageService.Kernel().stdin.write(input+"\n")
			}
		} else {
			//TODO: make a command only for administrators to force a new sage instance?
			setTimeout(() => AnswerQueue = false, 5000)
			await interaction.reply("Please wait, another Sage instance is present.")
		}
	},
}