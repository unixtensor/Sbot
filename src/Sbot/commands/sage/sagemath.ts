import { SlashCommandBuilder } from "discord.js"
import { warn } from "../../io.js"
import { MessageParser } from "../parsedOutput"
import { spawn } from "node:child_process"

let SageKernel_Data: string = ''

const SageKernel = class {
	public Kernel: any;

	constructor() {
		this.Kernel = spawn("sage", [], {shell: true})
		this.Kernel.stdout.setEncoding("utf8")
		process.stdin.pipe(this.Kernel.stdin)
	}

	readonly Handlers = {
		stderr: (data: string) => {
			warn([data])
			SageKernel_Data = `ERROR: ${data}`
		},
		onclose: (data: string) => {
			SageKernel_Data = ''
		},
		stdout: (data: string) => {
			
		},
	}
}

interface __interaction { 
	reply: (arg0: string) => any
}
module.exports = {
	data: new SlashCommandBuilder()
		.setName('sage')
		.setDescription('Open a sagemath kernel and run sagemath code (Python input).'),
	async execute(interaction: __interaction) {
		if (SageKernel_Data == '') {
			const Sage = new SageKernel()
			
			Sage.Kernel.stderr.on("data", (data: string) => Sage.Handlers.stderr(data.toString()))
			Sage.Kernel.on("close", (code: string)       => Sage.Handlers.onclose(code.toString()))
			Sage.Kernel.stdout.on("data", (data: string) => Sage.Handlers.stdout(data.toString()))

			const MessageData = new MessageParser(Sage_Data)
			await interaction.reply(MessageData.toBlockMessage())
		} else {
			await interaction.reply("Please wait, another Sage instance is present.")
		}
	},
}