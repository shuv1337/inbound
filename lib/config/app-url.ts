export const APP_URL =
	process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const INTERNAL_APP_URL = process.env.INTERNAL_BASE_URL || APP_URL;

export const API_BASE_URL = `${APP_URL}/api`;

export const DOCS_URL = process.env.DOCS_URL || `${APP_URL}/docs`;

export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "";

export const LEGAL_EMAIL = process.env.LEGAL_EMAIL || "";

const appHostname = new URL(APP_URL).hostname;

export const PASSKEY_RP_ID = appHostname;

export const PASSKEY_ORIGIN = APP_URL;

function extractDomain(hostname: string): string {
	const parts = hostname.split(".");
	if (parts.length <= 2) {
		return hostname;
	}
	return parts.slice(-2).join(".");
}

export const NOTIFICATION_DOMAIN = extractDomain(appHostname);
