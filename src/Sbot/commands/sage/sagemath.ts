import { SlashCommandBuilder } from "discord.js"
import { warn } from "../../io.js"
import { MessageParser } from "../parsedOutput"
import { spawn } from "node:child_process"

type SageService<T> = T

interface __Sage {
	AnswerQueue: string,
	Service: SageService<object> | null
}
interface __interaction { 
	reply: (arg0: string) => any
}

const Sage: __Sage = {
	AnswerQueue: '',
	Service: null
}

const SageKernel = class {
	public Kernel: {
		version: SageService<any>,
		constructor: SageService<any>
	};
	private FirstTime: boolean;
	public SageVersion: string | undefined

	constructor() {
		this.Kernel = {
			version: spawn("sage", ["--version"]),
			constructor: spawn("sage", [], {shell: true})
		}
		this.Kernel.version.stdout.setEncoding("utf8")
		this.Kernel.constructor.stdout.setEncoding("utf8")
		this.Kernel.version.stdout("data", (chunk: string) => this.SageVersion = chunk.toString())
		this.FirstTime = true //speed freak
	}

	readonly Handlers = {
		stdout: (chunk: string) => {
			if (this.FirstTime) {
				//this condition check is only here so this match doesn't get computed every single time std gets output lolz
				const isSageInfo = chunk.match(/[\n\w]/g)
				if (isSageInfo)
					this.FirstTime = false
			} else {
				const SageIn = chunk.match(/^sage:/)
				if (!SageIn) {

				}
			}
		}
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sage')
		.setDescription('Open a sagemath kernel and run sagemath code (Python input).'),
	async execute(interaction: __interaction) {
		if (Sage.AnswerQueue == '') {
			if (!Sage.Service) {
				const SageService = new SageKernel()
				const Kernel = SageService.Kernel.constructor

				Kernel.stdout("data", (chunk: string) => {

				})
				Sage.Service = SageService
			}
			
			const MessageData = new MessageParser(Sage.AnswerQueue)
			await interaction.reply(MessageData.CodeBlockMultiLine())

			Sage.AnswerQueue = ''
		} else {
			await interaction.reply("Please wait, another Sage instance is present.")
		}
	},
}