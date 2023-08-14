// Sbot
// @interpreterK - GitHub
// 2023

import { SlashCommandBuilder } from "discord.js"
import { spawn, exec } from "node:child_process"
import path from "node:path"
import fs from "node:fs"
import { warn, print } from "../../io.js"
import { MessageParser } from "../parsedOutput.js"
import { InteractionType } from "../../@types/discordjs.js"

type SageService<T> = T
type Kernel = SageService<any>

interface stdheap {
	entries: string[],
	filepath: string | null,
	parsed: boolean,
	status: {
		error: null | string | Error,
	}
}

let SageVersion: SageService<string> = "null"
exec("sage --version", (_, out) => SageVersion = new MessageParser(`Using SageMath Version: ${out}\n`).CodeBlock())

let AnswerQueue: boolean = false
const SageKernel: SageService<Kernel> = spawn("sage", [])
SageKernel.stdout.setEncoding("utf8")

const SageService = class {
	private FirstTime: boolean;
	public stdheap: stdheap;

	constructor() {
		this.FirstTime = true //speed freak
		this.stdheap = {
			entries: [],
			filepath: null,
			parsed: false, //Mark the operation done and return the final result
			status: {
				error: null
			}
		}
	}
	private clearstdheap(): void {
		this.stdheap = {entries: [], filepath: null, parsed: false, status: {error: null}}
	}

	public readonly Handlers = {
		stdout: (chunk: string): stdheap => {
			if (this.FirstTime) {
				//high-level optimization
				//this condition check is only here so this match doesn't get computed every single time std gets output
				if (chunk.match(/[\n\w]/g)) { //check if this isn't the introduction info to sagemath
					this.FirstTime = false
					this.clearstdheap()
				}
			} else {
				if (!chunk.match(/^sage:/)) {
					if (chunk.indexOf("png viewer") != -1) {
						//Here for later, https://doc.sagemath.org/html/en/reference/misc/sage/misc/temporary_file.html
						let PNG_Result_Path: string | null = null
						fs.readdir("/tmp/", (Error, Files) => {
							if (Error) {
								warn(["Error reading /tmp/ directory:", Error])
								this.stdheap.status.error = Error
							} else {
								Files.forEach((tmp_File: string) => {
									if (tmp_File.match(/^tmp.{8}$/)) {

									}
								})
							}
						})
						this.stdheap.filepath = PNG_Result_Path
					} else {
						warn(["No temp file for Sage was found in \"tmp\"."])
						this.stdheap.status.error = "No temp file for Sage was found in \"tmp\"."
					}
					this.stdheap.parsed = true
				} else {
					//sometimes, sage output's the input ("sage:") with the output result
					const operation_end = chunk.match(/sage:.?/)
					if (operation_end) {
						this.stdheap.parsed = true
						this.stdheap.entries.push(chunk.replace(/sage:.?/, ""))
					} else {
						this.stdheap.entries.push(chunk)
					}
				}
			}
			return this.stdheap
		}
	}
}

const Sage = new SageService()
const SageLogger = new Promise<string>((toResponse, toResponseFail) => {
	SageKernel.stdout.on("data", (chunk: string) => {
		const SageResult: stdheap = Sage.Handlers.stdout(chunk.toString())
		if (!SageResult.status.error) {
			if (SageResult.parsed) {
				print(["Got a SageMath result"])
				toResponse(
					SageResult.entries.length>1 ? SageResult.entries.join('\n') : SageResult.entries.join()
				)
			}
		} else {
			toResponse(SageResult.status.error.toString())
		}
	}) 
	SageKernel.stderr.on("data", (chunk: string) => {
		const str = chunk.toString()
		warn(["SageMath - stderr ERROR:", str])
		toResponseFail(str)
	})
})

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sage')
		.setDescription('Open a SageMath kernel instance and run SageMath code (Python input).')
		.addStringOption(o => o.setName("input").setDescription("Python input, check SageMath docs for more info. / https://www.sagemath.org/help.html").setRequired(true)),
	async execute(interaction: InteractionType) {
		if (!AnswerQueue) {
			AnswerQueue = true
			print(["SageMath command started"])
			const InteractionInput: string = interaction.options.getString("input")
			const InteractionInputFormat: string = new MessageParser(InteractionInput).CodeBlock()

			const SageLoggerFail = async (reject: string) => {
				warn(["The Sage logger failed (Rejected/Error):", reject])
				const FormatResult = new MessageParser(`The Sage logger failed (Rejected/Error): ${reject}`)
				await interaction.reply(``)
			}
			const SageReply = async (Response: string) => {
				const FormatResult = new MessageParser(`= ${Response}`)
				await interaction.reply(SageVersion+`Output of ${InteractionInputFormat}: ${FormatResult.CodeBlockMultiLine("asciidoc")}`)
			}
			const SageFailed = async (FailResponse: string) => {
				warn(["SageMath - Promise FailResponse ERROR:", FailResponse])
				const FormatResult = new MessageParser(FailResponse)
				await interaction.reply(SageVersion+`Sage failed. This is most likely not Sage's fault but my programming. ERROR: ${FormatResult.CodeBlockMultiLine()}`)
			}
			SageLogger.then(SageReply, SageFailed).catch(SageLoggerFail).finally(() => AnswerQueue = false)

			//Send the input with a CLRF "\r\n"
			SageKernel.stdin.write(InteractionInput+"\r\n")
		} else {
			//TODO: make a command only for administrators to force a new sage instance?
			setTimeout(() => AnswerQueue = false, 5000)
			await interaction.reply("Please wait, another Sage instance is present.")
		}
	},
}