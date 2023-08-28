// Sbot
// @interpreterK - GitHub
// 2023

import { ChildProcessWithoutNullStreams, spawn } from "child_process"
import { print, warn } from "../../io"
import EventEmitter from "node:events"

interface ProcessTable {
	pipeline: ChildProcessWithoutNullStreams,
	timeTree: {
		timeout?: NodeJS.Timeout,
		timerCallback?: () => void
	}
}

interface OpenProcessesHash {
	[index: string]: ProcessTable
}

const pmprint = (Output: any[]) => print(["[ProcessManager]:", ...Output])
const pmwarn = (Output: any[]) => warn(["[ProcessManager]:", ...Output])

const OpenProcesses: OpenProcessesHash = {}
const OpenProcessesStream_Properties = class {
 	/**
 	 * @Description How many minutes until the process checks its last active status?
 	*/
	public static ProcessSleepTimer = 5
 	/**
 	 * @Timer Minutes
 	*/
	public static LastUseTimer = 5
	/**
 	 * @Timer Seconds
 	*/
	public static ProcessSignalTimer = 5
	public static OpenProcesses = (): OpenProcessesHash => OpenProcesses
	public static onExit: EventEmitter = new EventEmitter()
}

const OpenProcessStream = class extends OpenProcessesStream_Properties {
	private ProcessName: string
	private AllowSleeping: boolean
	private Args: string[]

	constructor(ProcessName: string, AllowSleeping: boolean = true, Args: string[] = []) {
		super()
		this.ProcessName = ProcessName
		this.AllowSleeping = AllowSleeping
		this.Args = Args
	}

	public new(Bypass_SIGINT?: boolean): ChildProcessWithoutNullStreams {
		if (!OpenProcesses[this.ProcessName]) {
			OpenProcesses[this.ProcessName] = {
				pipeline: spawn(this.ProcessName, this.Args),
				timeTree: {}
			}
			const ProcessPipe = OpenProcesses[this.ProcessName]
			ProcessPipe.pipeline.stdout.setEncoding("utf8")
			if (this.AllowSleeping) {
				ProcessPipe.pipeline.stdout.on("data", () => {
					clearTimeout(ProcessPipe.timeTree.timeout)
					ProcessPipe.timeTree.timeout = setTimeout(ProcessPipe.timeTree.timerCallback!, OpenProcessStream.ProcessSleepTimer*6e4)
				})
				NewProcess_SIG_timer(ProcessPipe, this.ProcessName, Bypass_SIGINT)
				pmprint([`New process stream started: "${this.ProcessName}", arguments="${this.Args.join(",")}".`])
			}
		}
		return OpenProcesses[this.ProcessName].pipeline
	}
}

const ProcessEnd = (Process: ChildProcessWithoutNullStreams, Signal: NodeJS.Signals): boolean => {
	if (!Process.killed) {
		Process.kill(Signal)
	}
	return Process.killed
}

const NewProcess_SIG_timer = (Process: ProcessTable, ProcessName: string, Bypass_SIGINT?: boolean): void => {
	pmprint(["New process timer started."])
	Process.timeTree.timerCallback = () => {
		const Forceful_INT = () => {
			const SIGTERM = ProcessEnd(Process.pipeline, "SIGTERM")
			pmwarn([`Sending signal "SIGTERM" to "${ProcessName}" for sleeping. succession=`, SIGTERM])
			if (!SIGTERM) {
				setTimeout(() => {
					const SIGKILL = ProcessEnd(Process.pipeline, "SIGKILL")
					pmwarn([`Sending signal "SIGKILL" to "${ProcessName}" for sleeping. succession=`, SIGKILL])
				}, OpenProcessStream.ProcessSignalTimer*1e3)
			} else {
				OpenProcessesStream_Properties.onExit.emit("exit")
			}
		}
		if (Bypass_SIGINT) {
			Forceful_INT()
		} else {
			const SIGINT = ProcessEnd(Process.pipeline, "SIGINT")
			pmprint([`Sending signal "SIGINT" to "${ProcessName}" for sleeping. succession=`, SIGINT])
			if (!SIGINT) {
				setTimeout(Forceful_INT, OpenProcessStream.ProcessSignalTimer*1e3)
			} else {
				OpenProcessesStream_Properties.onExit.emit("exit")
			}
		}
	}
	Process.timeTree.timeout = setTimeout(Process.timeTree.timerCallback, OpenProcessStream.ProcessSleepTimer*6e4)	
}

export default OpenProcessStream