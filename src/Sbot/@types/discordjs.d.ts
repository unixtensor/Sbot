// Sbot
// @interpreterK - GitHub
// 2023

//dj14 is a shart of an api
import { Collection } from "discord.js"

declare module "discord.js" {
	export interface Client {
		commands: Collection<any, any> //??
	}
}

// :P
export interface InteractionType {
    options: {
    	getString: (arg0: string) => any
    }
	reply: (arg0: string) => any
}