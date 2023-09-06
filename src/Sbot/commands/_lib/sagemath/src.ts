// Sbot
// @interpreterK - GitHub
// 2023

// Future note, make use of xdg-mime. https://wiki.archlinux.org/title/XDG_MIME_Applications
//xdg-mime query default text/html
//xdg-mime query default image/png

import { ChildProcessWithoutNullStreams, exec } from "node:child_process"
import { warn, print } from "../../../io.js"
import path from "node:path"
import fs from "node:fs"
import EventEmitter from "node:events"
import MessageParser from "../ParseOutput.js"
import ProcessStream from "../ProcessManager.js"

type SageService<T> = T
type Kernel = ChildProcessWithoutNullStreams
type ResultEvent = EventEmitter

interface stdioheap {
	entries: string[],
	filepath: string,
	parsed: boolean
}

//Do error handling if the program is not installed
let SageVersion: SageService<string> = "null"
exec("sage --version", (_Error, Out) => SageVersion = new MessageParser(Out).CodeBlock())

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

let WelcomeCheck: boolean = false
let Kernel: null | Kernel = null
const KernelInstance = () => {
	if (!Kernel) {
		const SageStream = new ProcessStream("sage")
		Kernel = SageStream.new(true)
		ProcessStream.onExit.once("exit", () => {
			Kernel = null
			WelcomeCheck = false
		})
	}
	return Kernel
}

const SageService_Properties = class {
	public static Kernel: () => SageService<Kernel> = KernelInstance
	public static Version = (): SageService<string> => SageVersion
	public static ResultParsed: SageService<ResultEvent> = new EventEmitter()
}

const SageService = class extends SageService_Properties {
	public stdioheap: stdioheap;

	constructor() {
        super()
 		this.stdioheap = {
			entries: [],
			filepath: "",
			parsed: false, //Mark the operation done and return the final result
		}
	}
	
	private stdoutSync(chunk: string): stdioheap {
		if (!WelcomeCheck) {
			if (chunk.match(/[\n\W]/g)) {
				WelcomeCheck = true
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
					//firefox headless mode to take pictures of the html page?
				} else {
					const operation_end = chunk.match(/sage:.?/)
					if (operation_end) {
						this.stdioheap.parsed = true
						//oof
						if (!chunk.match(/^sage:/)) {
							this.stdioheap.entries.push(chunk.replace(/sage:/, ""))
						}
					} else {
						this.stdioheap.entries.push(chunk)
					}
				}
			}
		}
		return this.stdioheap
	}

	private clear_stdioheap(): void {
		this.stdioheap.entries = []
		this.stdioheap.filepath = ""
		this.stdioheap.parsed = false
	}

	public new(stdin_write?: string): void {
		SageService.Kernel().stdout.on("data", (chunk: string) => {
			const SageResult: stdioheap = this.stdoutSync(chunk)
			if (SageResult.parsed) {
				const ParsedData = SageResult.entries
				const UsingFile = SageResult.filepath != ""
				SageService.ResultParsed.emit("result", ParsedData, UsingFile, SageResult.filepath)
				this.clear_stdioheap()
			}
		})
		SageService.Kernel().stderr.on("data", (chunk: string) => {
			warn(["SageMath - stderr ERROR:", chunk])
			SageService.ResultParsed.emit("failed", chunk)
		})
		if (stdin_write) {
			SageService.Kernel().stdin.write(stdin_write+"\n")
		}
	}
}

export default SageService