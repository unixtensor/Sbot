import { SlashCommandBuilder } from "discord.js"
import { warn } from "../../io.js"
import { MessageParser } from "../parsedOutput"
import { spawn } from "node:child_process"

let SageKernel_Data: string = ''

const SageKernel = class {
	public Kernel: any;
	public SageKernelInfo: string | undefined

	constructor() {
		this.Kernel = spawn("sage", [], {shell: true})
		this.Kernel.stdout.setEncoding("utf8")
	}
	
	readonly Handlers = {
		stderr: (data: string) => {
			warn([data])
			SageKernel_Data = `ERROR: ${data}`
		},
		stdout: (data: string) => {
			
		},
		onclose: (data: string) => {
			SageKernel_Data = ''
		}
	}
}

//For speed
let cached_SageKernel: any = null

interface __interaction { 
	reply: (arg0: string) => any
}
module.exports = {
	data: new SlashCommandBuilder()
		.setName('sage')
		.setDescription('Open a sagemath kernel and run sagemath code (Python input).'),
	async execute(interaction: __interaction) {
		if (SageKernel_Data == '') {
			if (!cached_SageKernel) {
				cached_SageKernel = new SageKernel()
			}
			
			cached_SageKernel.Kernel.stderr.on("data", (data: string) => cached_SageKernel.Handlers.stderr(data.toString()))
			cached_SageKernel.Kernel.on("close", (code: string)       => cached_SageKernel.Handlers.onclose(code.toString()))
			cached_SageKernel.Kernel.stdout.on("data", (data: string) => cached_SageKernel.Handlers.stdout(data.toString()))

			const MessageData = new MessageParser(SageKernel_Data)
			await interaction.reply(MessageData.toBlockMessage())
			SageKernel_Data = ''
		} else {
			await interaction.reply("Please wait, another Sage instance is present.")
		}
	},
}