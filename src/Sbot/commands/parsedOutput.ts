const MessageParser = class {
	protected Input: string;
	
	constructor(Input: string) {
		this.Input = Input
	}

	CodeBlock(): string {
		return `\`${this.Input}\``
	}
	CodeBlockMultiLine(Language?: string): string {
		let BlockFormat: string = `\`\`\`\n${this.Input}\n\`\`\``
		if (Language) {
			BlockFormat = `\`\`\`${Language}\n${this.Input}\n\`\`\``
		}
		return BlockFormat
	}

	QuoteBlock(): string {
		return `> ${this.Input}`
	}
	QuoteBlockMultiLine(): string {
		return `>>> ${this.Input}`
	}
}

export {
	MessageParser
}