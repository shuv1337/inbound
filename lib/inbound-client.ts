import Inbound from "inboundemail";
import { INTERNAL_APP_URL } from "@/lib/config/app-url";

let client: Inbound | null = null;

export function getInboundClient(): Inbound {
	if (!client) {
		client = new Inbound({
			apiKey: process.env.INBOUND_API_KEY!,
			baseURL: INTERNAL_APP_URL,
		});
	}
	return client;
}
