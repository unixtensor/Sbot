// Sbot
// @interpreterK - GitHub
// 2023

import { spawn, exec, execSync } from "node:child_process"
import path from "node:path"
import fs from "node:fs"
import EventEmitter from "node:events"
import { warn } from "../../../io.js"
import { MessageParser } from "../parseOutput.js"

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

const SearchSageTemp = class {
	private LookForFormat: string;

	constructor(LookForFormat: string) {
		this.LookForFormat = LookForFormat
	}

	public SearchForNewest(): string {
		let FormatPath_Result = ""
		let FormatPath_ResultTime = 0
		
		fs.readdirSync("/tmp/").forEach((tmp_Folder: string) => {
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

const SageKernel = (): SageService<Kernel> => {
	const Kernel = spawn("sage", [])
	Kernel.stdout.setEncoding("utf8")
	return Kernel
}

//Do error handling if the program is not installed
let SageVersion: SageService<string> = "null"
exec("sage --version", (_Error, Out) => SageVersion = new MessageParser(Out).CodeBlock())

const SageService_Properties = class {
	public static Kernel: SageService<Kernel> = SageKernel()
	public static ResultParsed: SageService<EventEmitter> = new EventEmitter()
	public static Version: SageService<() => string> = () => SageVersion
}

const SageService = class extends SageService_Properties {
	private FirstTime: boolean;
	public stdioheap: stdioheap;

	constructor() {
        super()
		this.FirstTime = true
		this.stdioheap = {
			entries: [],
			filepath: "",
			parsed: false, //Mark the operation done and return the final result
			status: {
				error: undefined
			}
		}
	}

	public stdoutSync(chunk: string): stdioheap {
		if (this.FirstTime) {
			this.FirstTime = false
			this.stdioheap.entries = []
			this.stdioheap.filepath = ""
			this.stdioheap.status.error = undefined
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
					//firefox headless mode to take pictures of the html page
				} else {
					//sometimes, sage output's the input ("sage:") with the output result
					const NoNline_chunk = chunk.replace(/\n/, "")
					const operation_end = NoNline_chunk.match(/^sage:.?/)
					if (operation_end) {
						this.FirstTime = true
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

const SageInstance = new SageService()

SageService.Kernel.stdout.on("data", (chunk: string) => {
	const SageResult: stdioheap = SageInstance.stdoutSync(chunk)
	if (!SageResult.status.error) {
		if (SageResult.parsed) {
			const UsingFile = SageResult.filepath != ""
			const ParsedData = UsingFile && SageResult.filepath || SageResult.entries.join('\n')
			SageService.ResultParsed.emit("result", ParsedData, UsingFile)
		}
	} else {
		SageService.ResultParsed.emit("failed", SageResult.status.error)
	}
})

SageService.Kernel.stderr.on("data", (chunk: string) => {
	const str = chunk.toString()
	warn(["SageMath - stderr ERROR:", str])
	// SageFailed(str)
})

export default SageService