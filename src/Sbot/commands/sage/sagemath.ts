// Sbot
// @interpreterK - GitHub
// 2023

import { SlashCommandBuilder } from "discord.js"
import { spawn, exec } from "node:child_process"
import path from "node:path"
import { warn, print } from "../../io.js"
import { MessageParser } from "../parsedOutput.js"
import { InteractionType } from "../../@types/discordjs.js"
import { NewestFileFetch } from "commands/dirNewestFile.js"

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
	public stdheap: {
		entries: string[], 
		parsed: boolean
	};

	constructor() {
		this.Kernel = spawn("sage", [])
		this.Kernel.stdout.setEncoding("utf8")
		this.FirstTime = true //speed freak
		this.stdheap = {
			entries: [],
			parsed: false
		}
	}

	public readonly Handlers = {
		stdout: (chunk: string): string[] | boolean => {
			if (this.FirstTime) {
				//high-level optimization
				//this condition check is only here so this match doesn't get computed every single time std gets output
				if (chunk.match(/[\n\w]/g)) { //check if this isn't the introduction info to sagemath
					this.FirstTime = false
					this.stdheap.entries = [] //clear entries
				}
			} else {
				if (!chunk.match(/^sage:/)) {
					if (chunk.indexOf("png viewer") != -1) {
						//Here for later, https://doc.sagemath.org/html/en/reference/misc/sage/misc/temporary_file.html
						//^tmp.{8}$
						const tmp_Dir: string = "/tmp/"
						
					} else {
						this.stdheap.entries.push(chunk.replace(/sage:.?/, ""))
					}
				}
			}
			return this.stdheap.entries
		}
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sage')
		.setDescription('Open a SageMath kernel instance and run SageMath code (Python input).')
		.addStringOption(o => o.setName("input").setDescription("Python input, check SageMath docs for more info. / https://www.sagemath.org/help.html").setRequired(true)),
	async execute(interaction: InteractionType) {
		if (!AnswerQueue) {
			AnswerQueue = true
			print(["SageMath command started"])
			
			const UsingSageVersion: string = `Using SageMath Version: ${SageVersion}\n`
			const InteractionInput: string = interaction.options.getString("input")
			const InteractionInputFormat: string = new MessageParser(InteractionInput).CodeBlock()

			const Sage = new SageService()
			
			const SageReply = async (Response: string) => {
				const FormatResult = new MessageParser(`= ${Response}`)
				await interaction.reply(UsingSageVersion+`Output of ${InteractionInputFormat}: ${FormatResult.CodeBlockMultiLine("asciidoc")}`)
			}
			const SageFailed = async (FailResponse: string) => {
				warn(["SageMath - Promise FailResponse ERROR:", FailResponse])
				const FormatResult = new MessageParser(FailResponse)
				await interaction.reply(UsingSageVersion+`Sage failed. This is most likely not Sage's fault but my programming. ERROR: ${FormatResult.CodeBlockMultiLine()}`)
			}

			const SageLogger = new Promise<string>((toResponse, toResponseFail) => {
				Sage.Kernel.stdout.on("data", (chunk: string) => {
					const SageResult: string[] = Sage.Handlers.stdout(chunk.toString())
					if (SageResult.length != 0) {
						print(["Got a SageMath result"])
						toResponse(
							SageResult.length != 1 ? SageResult.join('\n') : SageResult.join()
						)
					}
				}) 
				Sage.Kernel.stderr.on("data", (chunk: string) => {
					const str = chunk.toString()
					warn(["SageMath - stderr ERROR:", str])
					toResponseFail(str)
				})
			})
			const SageLoggerFail = async (reject: string) => {
				warn(["The Sage logger failed (Rejected/Error):", reject])
				const FormatResult = new MessageParser(`The Sage logger failed (Rejected/Error): ${reject}`)
				await interaction.reply(``)
			}

			SageLogger.then(SageReply, SageFailed).catch(SageLoggerFail).finally(() => AnswerQueue = false)
			Sage.Kernel.stdin.write(InteractionInput)
			Sage.Kernel.stdin.end()
		} else {
			//TODO: make a command only for administrators to force a new sage instance?
			setTimeout(() => AnswerQueue = false, 10000)
			await interaction.reply("Please wait, another Sage instance is present.")
		}
	},
}