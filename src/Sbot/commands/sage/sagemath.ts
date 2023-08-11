// Sbot
// @interpreterK - GitHub
// 2023

import { SlashCommandBuilder } from "discord.js"
import { warn, print } from "../../io.js"
import { MessageParser } from "../parsedOutput.js"
import { spawn, exec } from "node:child_process"
import { InteractionType } from "../../@types/discordjs.js"

type SageService<T> = T
type Kernel = SageService<any>

//I had a whole cache system built for this for really good speed but i couldn't get NodeJS to keep writing to the process stream without calling "stdin.end()".
//Very unfortunate speed sacrifice
let AnswerQueue: boolean = false
let SageVersion: SageService<string> = "null"
exec("sage --version", (_, out) => SageVersion = new MessageParser(out).CodeBlock())

const SageService = class {
	public readonly Kernel: SageService<Kernel>;
	private FirstTime: boolean;
	private stdheap: string[];

	constructor() {
		this.Kernel = spawn("sage", [])
		this.Kernel.stdout.setEncoding("utf8")
		this.FirstTime = true //speed freak
		this.stdheap = []
	}

	readonly Handlers = {
		stdout: (chunk: string): string[] => {
			if (this.FirstTime) {
				//this condition check is only here so this match doesn't get computed every single time std gets output
				if (chunk.match(/[\n\w]/g)) { //check if this isn't the introduction info to sagemath
					this.FirstTime = false
					this.stdheap = []
				}
			} else {
				if (!chunk.match(/^sage:/)) {
					if (chunk.indexOf("png viewer")) {
						
					} else {
						this.stdheap.push(chunk.match(/sage:.?/) ? chunk.replace(/sage:.?/, "") : chunk)
					}
				}
			}
			return this.stdheap
		}
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sage')
		.setDescription('Open a sagemath kernel and run sagemath code (Python input).')
		.addStringOption(o => o.setName("input").setDescription("Python input, check sagemath docs for more info.").setRequired(true)),
	async execute(interaction: InteractionType) {
		if (!AnswerQueue) {
			AnswerQueue = true
			print(["SageMath command started"])
			
			const Sage = new SageService()
			const InteractionInput = interaction.options.getString("input")
			const InteractionInputFormat = new MessageParser(InteractionInput).CodeBlock()
			const SageReply = async (Response: string) => {
				const FormatResult = new MessageParser(Response)
				await interaction.reply(`Using Sage Version: ${SageVersion}\nOutput of ${InteractionInputFormat}: ${FormatResult.CodeBlockMultiLine("m")}`)
			}
			const SageFailed = async (FailResponse: string) => {
				warn(["SageMath - Promise FailResponse ERROR:", FailResponse])
				const FormatResult = new MessageParser(FailResponse)
				await interaction.reply(`Using Sage Version: ${SageVersion}\nSage failed. This is most likely not Sage's fault but my programming. ERROR: ${FormatResult.CodeBlockMultiLine()}`)
			}

			const SageLogger = new Promise<string>((toResponse, toResponseFail) => {
				Sage.Kernel.stdout.on("data", (chunk: string) => {
					const SageResult: string[] = Sage.Handlers.stdout(chunk.toString())
					if (SageResult) {
						print(["Got a SageMath result"])
						toResponse(SageResult.join('\n'))
					}
				}) 
				Sage.Kernel.stderr.on("data", (chunk: string) => {
					const str = chunk.toString()
					warn(["SageMath - stderr ERROR:", str])
					toResponseFail(str)
				})
			})

			SageLogger.then(SageReply, SageFailed).finally(() => AnswerQueue = false)
			Sage.Kernel.stdin.write(InteractionInput)
			Sage.Kernel.stdin.end()
		} else {
			//TODO: make a command only for administrators to force a new sage instance?
			setTimeout(() => AnswerQueue = false, 10000)
			await interaction.reply("Please wait, another Sage instance is present.")
		}
	},
}