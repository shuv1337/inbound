import { passkey } from "@better-auth/passkey";
import { render } from "@react-email/components";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { admin, apiKey, magicLink, oAuthProxy } from "better-auth/plugins";
import { and, eq } from "drizzle-orm";
import MagicLinkEmail from "@/emails/magic-link-email";
import {
	APP_URL,
	NOTIFICATION_DOMAIN,
	PASSKEY_ORIGIN,
	PASSKEY_RP_ID,
	SUPPORT_EMAIL,
} from "@/lib/config/app-url";
import { getInboundClient } from "@/lib/inbound-client";
import { db } from "../db/index";
import * as schema from "../db/schema";

// Blocked email domains - users cannot sign up with these domains
const BLOCKED_SIGNUP_DOMAINS = [
	// Mail.ru Group domains
	"mail.ru",
	"bk.ru",
	"inbox.ru",
	"list.ru",

	// Disposable/temp email services
	"trashmail.win",
	"bipochub.com",
	"fermiro.com",
	"dropeso.com",
	"nyfhk.com",
	"byom.de",
	"yopmail.com",
	"drmail.in",
	"protonza.com",
	"bitmens.com",
	"reuseme.info",
	"passmail.com",
	"mvpmedix.com",
	"tempmail.com",
	"guerrillamail.com",
	"mailinator.com",
	"10minutemail.com",
	"throwaway.email",
	"fakeinbox.com",
	"sharklasers.com",
	"guerrillamail.info",
	"grr.la",
	"guerrillamail.biz",
	"guerrillamail.de",
	"guerrillamail.net",
	"guerrillamail.org",
	"spam4.me",
	"temp-mail.org",
	"dispostable.com",
	"mailnesia.com",
	"getairmail.com",
	"mohmal.com",
	"tempail.com",
	"emailondeck.com",

	// Suspicious .xyz domains often used for spam
	"05050101.xyz",
	"621688.xyz",
];

const inbound = getInboundClient();

/**
 * Check if an email domain is blocked from signing up
 */
async function isBlockedEmailDomain(email: string): Promise<boolean> {
	const domain = email.split("@")[1]?.toLowerCase();
	if (!domain) return false;

	if (BLOCKED_SIGNUP_DOMAINS.includes(domain)) {
		return true;
	}

	try {
		const blockedDomain = await db
			.select({ id: schema.blockedSignupDomains.id })
			.from(schema.blockedSignupDomains)
			.where(
				and(
					eq(schema.blockedSignupDomains.domain, domain),
					eq(schema.blockedSignupDomains.isActive, true),
				),
			)
			.limit(1);

		return blockedDomain.length > 0;
	} catch (error) {
		console.error("Error checking blocked signup domain list:", error);
		return false;
	}
}

export const auth = betterAuth({
	baseURL: APP_URL,
	trustedOrigins: [APP_URL, "http://localhost:3000"],
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,
	}),
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
			redirectURI: `${APP_URL}/api/auth/callback/github`,
		},
		google: {
			prompt: "select_account",
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			redirectURI: `${APP_URL}/api/auth/callback/google`,
		},
	},
	session: {
		updateAge: 24 * 60 * 60, // 24 hours
		expiresIn: 60 * 60 * 24 * 7, // 7 days
	},
	user: {
		additionalFields: {
			featureFlags: {
				type: "string",
				required: false,
				defaultValue: null,
			},
		},
	},
	plugins: [
		oAuthProxy({
			productionURL: APP_URL,
			currentURL: APP_URL,
		}),
		apiKey({
			rateLimit: {
				enabled: true,
				timeWindow: 1000, // 1 second in milliseconds
				maxRequests: 4, // 4 requests per second
			},
		}),
		admin(),
		passkey({
			rpID: PASSKEY_RP_ID,
			rpName: "Inbound",
			origin: PASSKEY_ORIGIN,
		}),
		magicLink({
			expiresIn: 300, // 5 minutes
			disableSignUp: process.env.NODE_ENV === "development" ? false : true, // Only allow magic link for existing accounts - new users must use Google OAuth
			sendMagicLink: async ({ email, url }, request) => {
				console.log(`📧 Sending magic link to ${email}`);

				try {
					// Use Inbound SDK (throws on error)
					const response = await inbound.emails.send({
						from: `Inbound <noreply@notifications.${NOTIFICATION_DOMAIN}>`,
						to: email,
						subject: "Sign in to inbound",
						html: await render(MagicLinkEmail(url)),
						text: `Sign in to inbound\n\nClick this link to sign in: ${url}\n\nThis link will expire in 5 minutes.`,
						reply_to: SUPPORT_EMAIL || `support@${NOTIFICATION_DOMAIN}`,
					});

					console.log("✅ Magic link email sent successfully:", response.id);
				} catch (error) {
					console.error("❌ Error sending magic link:", error);
					throw error;
				}
			},
		}),
	],
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			// Block signups from banned email domains
			const body = ctx.body as { email?: string } | undefined;
			if (body?.email && (await isBlockedEmailDomain(body.email))) {
				console.log(
					`🚫 Blocked signup attempt from banned domain: ${body.email}`,
				);
				throw new Error(
					"Signups from this email domain are not allowed. Please use a different email address.",
				);
			}
		}),
		after: createAuthMiddleware(async (ctx) => {
			// Check if this is actually a new user creation (not just a login)
			if (ctx.context.newSession?.user) {
				const user = ctx.context.newSession.user;

				// Check if user was created very recently (within last 10 seconds)
				// This indicates actual signup vs existing user login
				const userCreatedAt = new Date(user.createdAt);
				const now = new Date();
				const timeDiffSeconds =
					(now.getTime() - userCreatedAt.getTime()) / 1000;

				if (timeDiffSeconds < 10) {
					console.log("New user signed up with email: ", user.email);

					// Redirect to onboarding page
					throw ctx.redirect("/onboarding-demo");
				} else {
					console.log("Existing user logged in with email: ", user.email);
					// need to redirect to dashboard
					throw ctx.redirect("/logs");
				}
			}
		}),
	},
});
