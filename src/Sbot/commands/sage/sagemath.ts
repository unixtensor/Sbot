const { SlashCommandBuilder } = require("discord.js")
const { warn }  = require("../../io.js")
const { spawn } = require("node:child_process")

const New_Sage_Kernel = (): any => {
	const Sage_Kernel = spawn("sage", [], {shell: true})
	Sage_Kernel.stdout.setEncoding("utf8")
	process.stdin.pipe(Sage_Kernel.stdin)
	return Sage_Kernel
}

interface __interaction { 
	reply: (arg0: string) => any
}
module.exports = {
	data: new SlashCommandBuilder()
		.setName('sage')
		.setDescription('Open a sagemath kernel and run sagemath code (Python input).'),
	async execute(interaction: __interaction) {
		const Sage = New_Sage_Kernel()
		let Data: string = ''
		Sage.stderr.on("data", (data: string) => {
			const err = data.toString()
			warn(err)
			Data = `ERROR: ${err}`
		})
		Sage.stdout.on("data", (data: string) => {
			//TODO: data handler (parsing strings) so sage info wont be sent, on results.
			if (Data == '') {
				Data = data.toString()
			}
		})
		await interaction.reply(Data)
	},
}