// Sbot
// @interpreterK - GitHub
// 2023

import { AttachmentBuilder, Message, SlashCommandBuilder } from "discord.js"
import { spawn, exec, execSync } from "node:child_process"
import path from "node:path"
import fs from "node:fs"
import { warn, print } from "../../io.js"
import { MessageParser } from "../parsedOutput.js"
import { InteractionType } from "../../@types/discordjs.js"

type SageService<T> = T
type Kernel = SageService<any>

interface stdioheap {
	entries: string[],
	filepath: string,
	parsed: boolean,
	status: {
		error?: string | Error,
	}
}

let SageVersion: SageService<string> = "null"
exec("sage --version", (_, out) => SageVersion = `Using: ${new MessageParser(out).CodeBlock()}\n`)

const SearchSageTemp = class {
	private LookForFormat: string;
	private TempLookAhead: string[];

	constructor(LookForFormat: string) {
		this.LookForFormat = LookForFormat
		this.TempLookAhead = fs.readdirSync("/tmp/")
	}

	SearchForNewest(): string {
		let FormatPath_Result = ""
		let FormatPath_ResultTime = 0
		
		this.TempLookAhead.forEach((tmp_Folder: string) => {
			//will it match sage's temp folder names?
			if (tmp_Folder.match(/^tmp.{8}$/)) {
				//if so read the directory
				const Sage_TempDir = fs.readdirSync(path.join("/tmp/", tmp_Folder))
				Sage_TempDir.forEach((Sage_TmpFile) => {
					if (Sage_TmpFile.endsWith(this.LookForFormat)) {
						const Format_Path = path.join("/tmp/", tmp_Folder, Sage_TmpFile)
						const stats = fs.statSync(Format_Path)

						if (stats.mtimeMs>FormatPath_ResultTime) {
							FormatPath_Result = Format_Path
							FormatPath_ResultTime = stats.mtimeMs
						}
					}
				})
			}
		})
		return FormatPath_Result
	}
}

const SageService = class {
	private FirstTime: boolean;
	public stdioheap: stdioheap;

	constructor() {
		this.FirstTime = true //speed freak
		this.stdioheap = {
			entries: [],
			filepath: "",
			parsed: false, //Mark the operation done and return the final result
			status: {
				error: undefined
			}
		}
	}
	private clearstdheap() {
		this.stdioheap = {entries: [], filepath: "", parsed: false, status: {error: undefined}}
	}

	public readonly Handlers = {
		stdoutSync: (chunk: string): stdioheap => {
			if (this.FirstTime) {
				//high-level optimization
				//this condition check is only here so this match doesn't get computed every single time std gets output
				if (chunk.match(/[\n\w]/g)) { //check if this isn't the introduction info to sagemath
					this.FirstTime = false
					this.clearstdheap()
				}
			} else {
				if (chunk != "\n" && chunk != "," && chunk != "") {
					if (chunk.indexOf("png viewer") != -1) {
						//Here for later, https://doc.sagemath.org/html/en/reference/misc/sage/misc/temporary_file.html
						// /tmp/
						const TempSearcher = new SearchSageTemp(".png")
						const PNGresult = TempSearcher.SearchForNewest()
						this.stdioheap.filepath = PNGresult
						this.stdioheap.entries.push(chunk)
						this.stdioheap.parsed = true
					} else if (chunk.indexOf("html viewer") != -1) {
						//??
					} else {
						//sometimes, sage output's the input ("sage:") with the output result
						const NoNline_chunk = chunk.replace(/\n/, "")
						const operation_end = NoNline_chunk.match(/sage:.?/)
						if (operation_end) {
							this.stdioheap.entries.push(NoNline_chunk.replace(/sage:.?/, ""))
							this.stdioheap.parsed = true
						} else {
							this.stdioheap.entries.push(NoNline_chunk)
						}
					}
				}
			}
			return this.stdioheap
		}
	}
}

const Sage = new SageService()

const SageKernel: SageService<Kernel> = spawn("sage", [])
SageKernel.stdout.setEncoding("utf8")

// const SageReply = async (Response: string) => {
// 	print(["SageReply:", Response])
// 	if (Interaction_scope) {
// 		const FormatResult = new MessageParser(`= ${Response}`)
// 		const InteractionFormat = new Message(Interaction_scope.options.getString("input"))
// 		await Interaction_scope.reply(SageVersion+`Output of ${Interaction_scope.InteractionInputFormat}: ${FormatResult.CodeBlockMultiLine("asciidoc")}`)

// 		Interaction_scope = null
// 	}
// }

// const SageFailed = async (FailResponse: string) => {
// 	warn(["SageMath - Promise FailResponse ERROR:", FailResponse])
// 	if (Interaction_scope.Interaction) {
// 		const FormatResult = new MessageParser(FailResponse)
// 		await Interaction_scope.Interaction.reply(SageVersion+`Sage failed. This is most likely not Sage's fault but my programming. ERROR: ${FormatResult.CodeBlockMultiLine()}`)

// 		Interaction_scope.Interaction = null
// 		Interaction_scope.InteractionInputFormat = null
// 	}
// }

SageKernel.stdout.on("data", (chunk: string) => {
	const SageResult: stdioheap = Sage.Handlers.stdoutSync(chunk.toString())
	if (!SageResult.status.error) {
		if (SageResult.parsed) {
			if (SageResult.filepath != "") {
				SageReply(SageResult.filepath)
			} else {
				SageReply(SageResult.entries.join(''))
			}
		}
	} else {
		SageReply(SageResult.status.error.toString())
	}
})
SageKernel.stderr.on("data", (chunk: string) => {
	const str = chunk.toString()
	warn(["SageMath - stderr ERROR:", str])
	SageFailed(str)
})

let AnswerQueue: boolean = false

module.exports = {
	data: new SlashCommandBuilder()
		.setName("sage")
		.setDescription("Open a SageMath kernel instance and run SageMath code (Python input).")
		.addStringOption(o => o.setName("input").setDescription("Python input, check SageMath docs for more info. / https://www.sagemath.org/help.html").setRequired(true)),
	async execute(interaction: InteractionType) {
		if (!AnswerQueue) {
			AnswerQueue = true
			print(["SageMath command started"])

			const input = interaction.options.getString("input")
			SageKernel.stdin.write(input+"\n")
		} else {
			//TODO: make a command only for administrators to force a new sage instance?
			setTimeout(() => AnswerQueue = false, 5000)
			await interaction.reply("Please wait, another Sage instance is present.")
		}
	},
}