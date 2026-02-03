/**
 * Simple Logger service that can be extended to support Sentry, Logtail, etc.
 */
export const Logger = {
	info: (message: string, context?: any) => {
		console.log(
			JSON.stringify({
				level: "info",
				message,
				context,
				timestamp: new Date().toISOString(),
			}),
		);
	},
	error: (message: string, error?: any, context?: any) => {
		console.error(
			JSON.stringify({
				level: "error",
				message,
				error: error?.message || error,
				stack: error?.stack,
				context,
				timestamp: new Date().toISOString(),
			}),
		);

		// Here you would add Sentry.captureException(error) or similar
	},
	warn: (message: string, context?: any) => {
		console.warn(
			JSON.stringify({
				level: "warn",
				message,
				context,
				timestamp: new Date().toISOString(),
			}),
		);
	},
};
