//dj14 is a shart of an api
import { Collection } from "discord.js"

declare module "discord.js" {
	export interface Client {
		commands: Collection<any, any>
	}
}