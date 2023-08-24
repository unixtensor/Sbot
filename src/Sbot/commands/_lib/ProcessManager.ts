import { ChildProcessWithoutNullStreams, spawn } from "child_process"

interface OpenProcessesHash {
	[index: string]: ChildProcessWithoutNullStreams | undefined
}

const NewProcessStream = class {
	public static ProcessSleepTime = 5 //Minutes

	constructor(Name: string) {
		if (!OpenProcesses[Name]) {
			OpenProcesses[Name] = spawn(Name, [])
			OpenProcesses[Name]!.stdout.setEncoding("utf-8")
			NewProcessProxy(OpenProcesses[Name]!)
		}
		return OpenProcesses[Name]!
	}
}

const OpenProcesses: OpenProcessesHash = {}
const NewProcessProxy = (Process: ChildProcessWithoutNullStreams): void => {
	setTimeout(() => {

	}, NewProcessStream.ProcessSleepTime*6e4)
}

export default NewProcessStream