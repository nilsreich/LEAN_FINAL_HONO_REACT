import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./global.css";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			gcTime: 1000 * 60 * 60 * 24, // 24 hours
			staleTime: 1000 * 60 * 5, // 5 minutes
		},
	},
});

const persister = createAsyncStoragePersister({
	storage: {
		getItem: (key) => get(key),
		setItem: (key, value) => set(key, value),
		removeItem: (key) => del(key),
	},
});

persistQueryClient({
	queryClient,
	persister,
	maxAge: 1000 * 60 * 60 * 24, // 24 hours
});

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<App />
		</QueryClientProvider>
	</React.StrictMode>,
);
