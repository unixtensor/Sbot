import { ChildProcessWithoutNullStreams, spawn } from "child_process"

const ProcessSleepTime = 5000 //ms

const NewProcess = class {
	public static OpenProcesses: {[index: string]: ChildProcessWithoutNullStreams} = {}

	constructor(Name: string) {
		if (!NewProcess.OpenProcesses[Name]) {
			
		}
	}
}

export {
	NewProcess
}