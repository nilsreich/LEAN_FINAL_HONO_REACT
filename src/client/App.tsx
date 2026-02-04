import { createRouter, RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import { routeTree } from "../routeTree.gen.ts";
import { authClient } from "./auth/auth-client.ts";
import "./global.css";

// --- ROUTER SETUP ---
const router = createRouter({ routeTree });

// Register for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

function App() {
	const { isPending } = authClient.useSession();

	// Remove splash screen only when auth is settled
	useEffect(() => {
		if (!isPending) {
			// @ts-expect-error
			window.removeSplash?.();
		}
	}, [isPending]);

	if (isPending) return null;

	return <RouterProvider router={router} />;
}

export default App;
