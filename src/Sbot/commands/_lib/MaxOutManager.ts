import { print } from "../../io";

const mdoprint = (Output: any[]) => print(["[MaxStrOut]:", ...Output])

const MaxStrOut = (FullMessage: string, CodeBlock_chunk?: string): string => {
	if (FullMessage.length>2e3) {
		let UsingCB = CodeBlock_chunk ? CodeBlock_chunk.length : 0
		FullMessage = FullMessage.slice(FullMessage.length, 2e3-UsingCB-8)+" (. . .)"
		mdoprint([`Sub-stringed/truncated "${FullMessage}" ${CodeBlock_chunk}`])
	}
	return FullMessage
}

export default MaxStrOut