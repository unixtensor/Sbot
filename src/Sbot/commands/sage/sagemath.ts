// Sbot
// @interpreterK - GitHub
// 2023

import { SlashCommandBuilder } from "discord.js"
import { warn } from "../../io.js"
import { MessageParser } from "../parsedOutput"
import { spawn, exec } from "node:child_process"

type SageService<T> = T

interface __Sage {
	AnswerQueue: string
}
interface __interaction { 
	reply: (arg0: string) => any
}

const Sage: __Sage = {
	AnswerQueue: ''
}

//I had a whole cache system built for this for really good speed but i couldn't get NodeJS to keep writing to the process stream without calling "stdin.end()".
//Very unfortunate speed sacrifice,

let SageVersion: SageService<string> = "null"
exec("sage -v", (_, out) => SageVersion = out)

const SageKernel = class {
	public readonly Kernel: SageService<any>;
	private FirstTime: boolean;

	constructor() {
		this.Kernel = spawn("sage", [], {shell: true})
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
		},

		stderr: (chunk: string) => {
			warn(["SageMath - stderr ERROR:", chunk])
		}
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sage')
		.setDescription('Open a sagemath kernel and run sagemath code (Python input).')
		.addStringOption(o => o.setName("input").setDescription("Python input, check sagemath docs for more info.").setRequired(true)),
	async execute(interaction: __interaction) {
		if (Sage.AnswerQueue == '') {
			const SageService = new SageKernel()
			const Kernel = SageService.Kernel

			Kernel.stdout("data", (chunk: string) => {
				const SageResult: string = SageService.Handlers.stdout(chunk.toString())
				if (SageResult) {
					
				}
			})
			Kernel.stderr("data", (chunk: string) => SageService.Handlers.stderr(chunk.toString()))
		
			const MessageData = new MessageParser(Sage.AnswerQueue)
			await interaction.reply(MessageData.CodeBlockMultiLine())

			Sage.AnswerQueue = ''
		} else {
			await interaction.reply("Please wait, another Sage instance is present.")
		}
	},
}