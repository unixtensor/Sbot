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
		error: boolean,
		errorfeed: string,
	}
}

let SageVersion: SageService<string> = "null"
exec("sage --version", (_, out) => SageVersion = new MessageParser(out).CodeBlock())

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
				error: false,
				errorfeed: ""
			}
		}
	}

	public readonly Handlers = {
		stdout: (chunk: string): stdheap => {
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
						const tmp_Files = fs.readdirSync("/tmp/").filter((folder: string) => {
							const isTheTempFolder = folder.match(/^tmp.{8}$/)
							return isTheTempFolder && isTheTempFolder[0]
						})
						if (tmp_Files.length != 0) {
							for (const Cache of tmp_Files) {
								const Cache_Files = fs.readdirSync(path.join("/tmp/", Cache)).filter((file: string) => file.endsWith(".png"))
								if (Cache_Files[0]) {
									for (const pngImage of Cache_Files) {
										
									}
								}
							}
						} else {
							warn(["No temp file for Sage was found in \"tmp\"."])
							this.stdheap.status.error = true
							this.stdheap.status.errorfeed = "No temp file for Sage was found in \"tmp\"."
						}
						this.stdheap.parsed = true
					} else {
						//sometimes, sage output's input ("sage:") with the output result
						const operation_end = chunk.match(/sage:.?/)
						if (operation_end) {
							this.stdheap.parsed = true
							this.stdheap.entries.push(chunk.replace(/sage:.?/, ""))
						} else {
							this.stdheap.entries.push(chunk)
						}
					}
				} else {
					this.stdheap.parsed = true
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
			toResponse(SageResult.status.errorfeed)
		}
	}) 
	SageKernel.stderr.on("data", (chunk: string) => {
		const str = chunk.toString()
		warn(["SageMath - stderr ERROR:", str])
		toResponseFail(str)
	})
})
const UsingSageVersion: string = `Using SageMath Version: ${SageVersion}\n`


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
				await interaction.reply(UsingSageVersion+`Output of ${InteractionInputFormat}: ${FormatResult.CodeBlockMultiLine("asciidoc")}`)
			}
			const SageFailed = async (FailResponse: string) => {
				warn(["SageMath - Promise FailResponse ERROR:", FailResponse])
				const FormatResult = new MessageParser(FailResponse)
				await interaction.reply(UsingSageVersion+`Sage failed. This is most likely not Sage's fault but my programming. ERROR: ${FormatResult.CodeBlockMultiLine()}`)
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