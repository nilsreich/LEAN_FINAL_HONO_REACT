import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from "@tanstack/react-router";
import { authClient } from "./auth/auth-client";
import "./global.css";
import { Navbar } from "./components/layout/Navbar";
import { CreatePostPage } from "./pages/CreatePostPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { PostDetailPage } from "./pages/PostDetailPage";

// --- 1. ROOT LAYOUT ---
const rootRoute = createRootRoute({
	component: () => {
		return (
			<div className="flex flex-col min-h-screen">
				<Navbar />
				<main className="flex-grow w-full max-w-2xl mx-auto px-4 py-6">
					<Outlet />
				</main>
				<footer className="footer footer-center p-10 bg-base-200 text-base-content rounded opacity-30">
					<aside>
						<p>Copyright © 2026 - All right reserved by PostApp</p>
					</aside>
				</footer>
			</div>
		);
	},
});

// --- 2. ROUTES ---
const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: HomePage,
});

const loginRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/login",
	component: LoginPage,
});

const createPostRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/create",
	component: CreatePostPage,
});

const postDetailRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/posts/$postId",
	component: PostDetailPage,
});

// --- ROUTER SETUP ---
const routeTree = rootRoute.addChildren([indexRoute, loginRoute, createPostRoute, postDetailRoute]);
const router = createRouter({ routeTree });

// Register for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

function App() {
	const { isPending } = authClient.useSession();

	if (isPending) return null; // Splash screen handles initial load

	return <RouterProvider router={router} />;
}

export default App;
