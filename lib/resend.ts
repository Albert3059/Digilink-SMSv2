import { Resend } from "resend";

/**
 * Return a Resend client instance at runtime, or `null` if the API key is not configured.
 * Avoids creating the client at module load-time so builds (e.g. Amplify SSR) won't fail
 * when `RESEND_API_KEY` is absent during build.
 */
export function getResend(): Resend | null {
	const key = process.env.RESEND_API_KEY;
	if (!key) return null;
	return new Resend(key);
}

/**
 * Safe wrapper to send an email. Throws if the service isn't configured or the send fails.
 * Consumers should catch exceptions and return appropriate HTTP responses.
 */
export async function safeSendEmail(payload: any) {
	const client = getResend();
	if (!client) {
		const err = new Error("RESEND_API_KEY is not configured");
		console.error("[resend] %s", err.message);
		throw err;
	}

	// Delegate to the Resend SDK; let exceptions bubble up for callers to handle.
	return client.emails.send(payload as any);
}

export default { getResend, safeSendEmail };
