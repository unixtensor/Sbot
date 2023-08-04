const LOCAL_Time = (): string => {
	const now = new Date()
	if (now) {
		const TIME = now.toString().match(/\d+:\d+:\d+/)
		return TIME && TIME[0] || "???"
	}
	return "???"
}
module.exports = {
	print: (Output: any[]) => console.log(`[${LOCAL_Time()}]:`, ...Output),
	warn:  (Output: any[]) => console.warn(`[${LOCAL_Time()}]:`, ...Output),
	error: (Output: any[]) => console.error(`[${LOCAL_Time()}]:`, ...Output)
}