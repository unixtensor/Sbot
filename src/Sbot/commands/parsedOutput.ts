const MessageParser = class {
	protected Input: string;
	
	constructor(Input: string) {
		this.Input = Input
	}

	toBlockMessage(Language?: string): string {
		let BlockFormat: string = `\`\`\`\n${this.Input}\n\`\`\``
		if (Language) {
			BlockFormat = `\`\`\`${Language}\n${this.Input}\n\`\`\``
		}
		return BlockFormat
	}
}

export {
	MessageParser
}