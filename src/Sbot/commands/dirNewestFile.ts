import { warn } from "../io.js"
import fs from "node:fs"
import path from "node:path"

const FetchLatest = (DirectoryPath: string): string | null => {
	let NewestFile: string | null = null
	fs.readdir(DirectoryPath, (Error, Files) => {
		if (Error) {
			warn(["Error reading directory.", Error])
		} else {
			Files.forEach(File => {
				const FilePath = path.join(DirectoryPath, File)
				fs.stat(FilePath, (Error, Stats) => {
					if (Error) {
						warn(["Error getting the file stats.", Error])
					} else {
						if (Stats.mtimeMs>0) {
							NewestFile = File
						}
					}
				})
			})
		}
	})
	return NewestFile
}

export {
	FetchLatest
}