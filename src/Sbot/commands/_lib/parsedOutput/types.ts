// Sbot
// @interpreterK - GitHub
// 2023

export declare class MessageParser {
	protected Input: string;

	constructor(Input: string)

	CodeBlock(): string
	CodeBlockMultiLine(Language?: string): string
	QuoteBlock(): string
	QuoteBlockMultiLine(): string
}