// Sbot
// @interpreterK - GitHub
// 2023

const LOCAL_Time = (): string => {
	const now = new Date()
	if (now) {
		const TIME = now.toString().match(/\d+:\d+:\d+/)
		return TIME && TIME[0] || "???"
	}
	return "???"
}

const print = (Output: any[]) => console.log(`[${LOCAL_Time()}]:`, ...Output)
const warn  = (Output: any[]) => console.warn(`[${LOCAL_Time()}]:`, ...Output)
const error = (Output: any[]) => console.error(`[${LOCAL_Time()}]:`, ...Output)

export {
	print,
	warn,
	error
}