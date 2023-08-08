// Sbot
// @interpreterK - GitHub
// 2023

import { SlashCommandBuilder } from "discord.js"
import { warn } from "../../io.js"
import { MessageParser } from "../_lib/parsedOutput/src.js"
import { spawn, exec } from "node:child_process"

type SageService<T> = T

interface __Sage {
	AnswerQueue: boolean
}
interface __interaction { 
	reply: (arg0: string) => any
}

const Sage: __Sage = {
	AnswerQueue: false
}

//I had a whole cache system built for this for really good speed but i couldn't get NodeJS to keep writing to the process stream without calling "stdin.end()".
//Very unfortunate speed sacrifice,e

let SageVersion: SageService< | null> = null
exec("sage -v", (_, out) => SageVersion = new MessageParser(out))

const SageKernel = class {
	public readonly Kernel: SageService<any>;
	private FirstTime: boolean;

	constructor() {
		this.Kernel = spawn("sage", [])
		this.Kernel.stdout.setEncoding("utf8")
		this.FirstTime = true //speed freak
	}

	readonly Handlers = {
		stdout: (chunk: string): string => {
			let str: string = ""
			if (this.FirstTime) {
				//this condition check is only here so this match doesn't get computed every single time std gets output
				if (chunk.match(/[\n\w]/g)) //check if this isn't the introduction info to sagemath
					this.FirstTime = false
			} else {
				if (!chunk.match(/^sage:/))
					str = chunk
			}
			return str
		}
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sage')
		.setDescription('Open a sagemath kernel and run sagemath code (Python input).')
		.addStringOption(o => o.setName("input").setDescription("Python input, check sagemath docs for more info.").setRequired(true)),
	async execute(interaction: __interaction) {
		if (!Sage.AnswerQueue) {
			Sage.AnswerQueue = true
			const SageService = new SageKernel()
			const Kernel = SageService.Kernel
			const SageLogger = new Promise<string>((toResponse, toResponseFail) => {
				Kernel.stdout("data", (chunk: string) => {
					const SageResult: string = SageService.Handlers.stdout(chunk.toString())
					if (SageResult) {
						toResponse(SageResult)
					}
				})
				Kernel.stderr("data", (chunk: string) => {
					const str = chunk.toString()
					warn(["SageMath - stderr ERROR:", str])
					toResponseFail(str)
				})
			})

			SageLogger.then(async (Reponse: string) => {
				const SageResponse_Res = new MessageParser(Reponse)

				await interaction.reply(`Using Sage Version: ${SageVersion.CodeBlock()}
					Output: ${SageResponse_Res.CodeBlockMultiLine()}`)
				Sage.AnswerQueue = false
			}, async (FailResponse: string) => {
				const SageVersion_Res = new MessageParser(SageVersion)

				await interaction.reply(``)
			})
		} else {
			//TODO: make a command only for administrators to force a new sage instance
			await interaction.reply("Please wait, another Sage instance is present.")
		}
	},
}