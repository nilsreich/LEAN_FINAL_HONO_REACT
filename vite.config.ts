import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		TanStackRouterVite(),
		react(),
		tailwindcss(),
		VitePWA({
			registerType: "autoUpdate",
			injectRegister: "auto",
			workbox: {
				navigateFallbackDenylist: [/^\/admin/, /^\/api/],
				runtimeCaching: [
					{
						urlPattern: ({ url }) =>
							url.pathname.startsWith("/api") || url.pathname.startsWith("/admin"),
						handler: "NetworkOnly",
					},
				],
			},
			manifest: {
				name: "Bun Hono Multi-Post",
				short_name: "PostApp",
				description: "A minimal PWA for posting content",
				theme_color: "#ffffff",
				icons: [
					{
						src: "/icon-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any maskable",
					},
				],
			},
		}),
	],
	server: {
		proxy: {
			"/api": "http://localhost:3000",
		},
	},
	preview: {
		proxy: {
			"/api": "http://localhost:3000",
		},
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
		rollupOptions: {
			output: {
				manualChunks: {
					"vendor-react": ["react", "react-dom"],
					"vendor-tanstack": ["@tanstack/react-query", "@tanstack/react-router"],
					"vendor-utils": ["lucide-react", "zod"],
				},
			},
		},
	},
});
