import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { html } from "hono/html";

// --- TYPES ---

type PinoLogEntry = {
	time: string;
	event: string;
	path: string;
	userHash: string;
	os: string;
	browser: string;
	type: string;
	[key: string]: unknown;
};

type AnalyticsMetrics = {
	totalViews: number;
	uniqueUsers: number;
	avgSessionTime: string;
	engagementScore: number;
	bounceRate: number;
	activeNow: number;
	topPaths: { path: string; count: number; isApi: boolean }[];
	deviceStats: { label: string; value: number }[];
	osStats: { label: string; value: number }[];
	browserStats: { label: string; value: number }[];
	hourlyTraffic: number[];
	recentEvents: PinoLogEntry[];
	systemHealth?: {
		avgLatency: number;
		errorRate: number;
		successRate: number;
		statusCodes: Record<number, number>;
	};
};

// --- UTILS ---

const NOISE_PATHS = [
	/^\/sw\.js/,
	/^\/workbox-/,
	/^\/manifest/,
	/^\/favicon/,
	/^\/assets\//,
	/registerSW/,
];
const isTechNoise = (path: string) => NOISE_PATHS.some((re) => re.test(path));

// --- DATA PROCESSING ---

async function getAdvancedAnalytics(hideNoise = true): Promise<AnalyticsMetrics | null> {
	try {
		const file = Bun.file("./analytics.log");
		if (!(await file.exists())) return null;

		const text = await file.text();
		const lines = text.trim().split("\n");
		const allEntries: PinoLogEntry[] = lines
			.map((line) => {
				try {
					return JSON.parse(line) as PinoLogEntry;
				} catch {
					return null;
				}
			})
			.filter((e): e is PinoLogEntry => e !== null);

		// Filter noise for core metrics
		const entries = hideNoise ? allEntries.filter((e) => !isTechNoise(e.path)) : allEntries;

		const userSessions = new Map<string, PinoLogEntry[]>();
		const hourly = new Array(24).fill(0);
		const paths: Record<string, number> = {};
		const browsers: Record<string, number> = {};
		const osMap: Record<string, number> = {};
		const deviceMap: Record<string, number> = {};

		const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
		const activeUsersTemp = new Set<string>();

		for (const entry of entries) {
			const list = userSessions.get(entry.userHash) || [];
			list.push(entry);
			userSessions.set(entry.userHash, list);

			const time = new Date(entry.time).getTime();
			const hour = new Date(time).getHours();
			hourly[hour]++;

			if (time > fiveMinsAgo) activeUsersTemp.add(entry.userHash);

			paths[entry.path] = (paths[entry.path] || 0) + 1;
			browsers[entry.browser] = (browsers[entry.browser] || 0) + 1;
			osMap[entry.os] = (osMap[entry.os] || 0) + 1;
			deviceMap[entry.type] = (deviceMap[entry.type] || 0) + 1;
		}

		let totalSessionSeconds = 0;
		let totalSessions = 0;
		let singleEventSessions = 0;

		for (const [_hash, userEntries] of userSessions) {
			const sorted = userEntries.sort(
				(a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
			);
			let currentSessionEvents = 0;
			let sessionStart = new Date(sorted[0]!.time).getTime();
			let lastEvent = sessionStart;
			totalSessions++;
			currentSessionEvents = 1;

			for (let i = 1; i < sorted.length; i++) {
				const current = new Date(sorted[i]!.time).getTime();
				if (current - lastEvent > 30 * 60 * 1000) {
					if (currentSessionEvents === 1) singleEventSessions++;
					totalSessionSeconds += (lastEvent - sessionStart) / 1000;
					sessionStart = current;
					totalSessions++;
					currentSessionEvents = 1;
				} else {
					currentSessionEvents++;
				}
				lastEvent = current;
			}
			if (currentSessionEvents === 1) singleEventSessions++;
			totalSessionSeconds += (lastEvent - sessionStart) / 1000;
		}

		const avgSec = totalSessions > 0 ? totalSessionSeconds / totalSessions : 0;
		const engagementScore =
			totalSessions > 0 ? Number((entries.length / totalSessions).toFixed(1)) : 0;
		const bounceRate =
			totalSessions > 0 ? Math.round((singleEventSessions / totalSessions) * 100) : 0;

		// --- SYSTEM HEALTH (from system.log) ---
		const systemFile = Bun.file("./system.log");
		let systemHealth = undefined;
		if (await systemFile.exists()) {
			const sysText = await systemFile.text();
			const sysLines = sysText.trim().split("\n");
			let totalLat = 0;
			let errors = 0;
			let totalRequests = 0;
			const codes: Record<number, number> = {};

			for (const line of sysLines) {
				try {
					const entry = JSON.parse(line);
					if (entry.duration && entry.status) {
						const lat = parseInt(entry.duration) || 0;
						totalLat += lat;
						totalRequests++;
						if (entry.status >= 400) errors++;
						codes[entry.status] = (codes[entry.status] || 0) + 1;
					}
				} catch (_) {
					// Skip malformed lines
				}
			}

			if (totalRequests > 0) {
				systemHealth = {
					avgLatency: Math.round(totalLat / totalRequests),
					errorRate: Math.round((errors / totalRequests) * 100),
					successRate: Math.round(((totalRequests - errors) / totalRequests) * 100),
					statusCodes: codes,
				};
			}
		}

		return {
			totalViews: entries.length,
			uniqueUsers: userSessions.size,
			avgSessionTime: `${Math.floor(avgSec / 60)}m ${Math.floor(avgSec % 60)}s`,
			engagementScore,
			bounceRate,
			activeNow: activeUsersTemp.size,
			hourlyTraffic: hourly,
			topPaths: Object.entries(paths)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5)
				.map(([path, count]) => ({ path, count, isApi: path.startsWith("/api") })),
			deviceStats: Object.entries(deviceMap).map(([label, value]) => ({ label, value })),
			osStats: Object.entries(osMap).map(([label, value]) => ({ label, value })),
			browserStats: Object.entries(browsers)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 3)
				.map(([label, value]) => ({ label, value })),
			recentEvents: allEntries.slice(-50).reverse(),
			systemHealth,
		};
	} catch (_e) {
		return null;
	}
}

// --- ROUTER ---

const adminRouter = new Hono();

adminRouter.use(
	"*",
	basicAuth({
		username: process.env.ADMIN_USER || "admin",
		password: process.env.ADMIN_PASSWORD || "admin123",
	}),
);

adminRouter.get("/", async (c) => {
	const filter = c.req.query("filter") || "real";
	const metrics = await getAdvancedAnalytics(filter === "real");

	if (!metrics) return c.html(html`<h1>No logs found. Visit the app first!</h1>`);

	return c.html(html`
<!DOCTYPE html>
<html lang="en" class="bg-black text-zinc-400">
<head>
    <meta charset="UTF-8" /><title>Pulse | Admin</title>
    <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        .heatmap-bar { transition: height 0.5s ease; }
        .modal-backdrop { 
            backdrop-filter: blur(4px);
            background-color: rgba(0,0,0,0.7);
            transition: opacity 0.2s ease;
        }
        .modal-content {
            box-shadow: 0 0 40px rgba(0,0,0,0.5);
        }
        [data-modal-open] { cursor: pointer; }
    </style>
</head>
<body class="p-4 md:p-8 font-sans bg-zinc-950 text-zinc-400 selection:bg-zinc-800 selection:text-white">
    <!-- Modal Backdrop -->
    <div id="infoModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="modal-backdrop absolute inset-0 backdrop-blur-sm bg-black/80" onclick="closeModal()"></div>
        <div class="modal-content relative bg-zinc-900 border border-zinc-800 p-8 rounded-xl max-w-lg w-full transform transition-all duration-200 opacity-0 scale-95 shadow-2xl">
            <h2 id="modalTitle" class="text-white text-xl font-bold mb-4 tracking-tight"></h2>
            <div id="modalBody" class="text-sm leading-relaxed text-zinc-400 space-y-3"></div>
            <button onclick="closeModal()" class="mt-8 w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded transition-colors uppercase tracking-widest">Schließen</button>
        </div>
    </div>

    <div class="max-w-6xl mx-auto">
        <header class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 border-b border-zinc-900 pb-8">
            <div>
                <h1 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    Pulse <span class="text-zinc-600 font-light">| Engine Admin</span>
                </h1>
                <p class="text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em] mt-2">Metrics & Infrastructure Intelligence</p>
            </div>
            <div class="flex bg-zinc-900 p-0.5 rounded border border-zinc-800/50">
                <a href="?filter=real" class="px-5 py-1.5 rounded text-[10px] font-bold tracking-wider ${filter === "real" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"} transition-all">REAL USERS</a>
                <a href="?filter=all" class="px-5 py-1.5 rounded text-[10px] font-bold tracking-wider ${filter === "all" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"} transition-all">RAW LOGS</a>
            </div>
        </header>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-zinc-900 border border-zinc-900 rounded-lg overflow-hidden mb-12">
            <div class="bg-zinc-950 p-6 relative flex flex-col group">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Growth</span>
                    <button data-info-title="Besucher-Metriken" data-info-body="Unique Users zählt die eindeutigen Identitäten pro Tag. Active Now zeigt Nutzer, die in den letzten 5 Minuten aktiv waren. Dies ist der wichtigste Indikator für aktuelle Relevanz." class="info-btn text-zinc-800 hover:text-zinc-400 transition-colors">
                        <i data-lucide="info" class="w-3 h-3"></i>
                    </button>
                </div>
                <div class="text-3xl font-light text-white tracking-tight">${metrics.uniqueUsers}</div>
                <div class="mt-auto pt-4 text-[9px] font-bold text-emerald-500/80 uppercase tracking-tighter flex items-center gap-1.5">
                    <span class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span> ${metrics.activeNow} Active Now
                </div>
            </div>

            <div class="bg-zinc-950 p-6 relative flex flex-col">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Retention</span>
                    <button data-info-title="Sitzungs-Qualität" data-info-body="Die durchschnittliche Verweildauer gibt an, wie lange ein Nutzer pro Session aktiv ist. Ein hoher Wert zeigt, dass die Inhalte fesselnd sind." class="info-btn text-zinc-800 hover:text-zinc-400 transition-colors">
                        <i data-lucide="info" class="w-3 h-3"></i>
                    </button>
                </div>
                <div class="text-3xl font-light text-white tracking-tight">${metrics.avgSessionTime}</div>
                <div class="mt-auto pt-4 text-[9px] font-bold text-blue-500/80 uppercase tracking-tighter flex items-center gap-1.5">
                    Avg. Duration
                </div>
            </div>

            <div class="bg-zinc-950 p-6 relative flex flex-col">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Stickiness</span>
                    <button data-info-title="Interaktions-Tiefe" data-info-body="Engagement Score misst Aktionen pro Sitzung. Ein Wert von 1.0 bedeutet, dass Nutzer meist nur eine Seite sehen und gehen." class="info-btn text-zinc-800 hover:text-zinc-400 transition-colors">
                        <i data-lucide="info" class="w-3 h-3"></i>
                    </button>
                </div>
                <div class="text-3xl font-light text-white tracking-tight">${metrics.engagementScore}</div>
                <div class="mt-auto pt-4 text-[9px] font-bold text-amber-500/80 uppercase tracking-tighter flex items-center gap-1.5">
                    Actions / Session
                </div>
            </div>

            <div class="bg-zinc-950 p-6 relative flex flex-col">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Attrition</span>
                    <button data-info-title="Absprungrate" data-info-body="Die Bounce Rate zeigt den Prozentsatz der Nutzer, die nach nur einer Interaktion die Seite verlassen. Ein niedriger Wert (<40%) ist exzellent." class="info-btn text-zinc-800 hover:text-zinc-400 transition-colors">
                        <i data-lucide="info" class="w-3 h-3"></i>
                    </button>
                </div>
                <div class="text-3xl font-light text-white tracking-tight">${metrics.bounceRate}%</div>
                <div class="mt-auto pt-4 text-[9px] font-bold text-rose-500/80 uppercase tracking-tighter flex items-center gap-1.5">
                    Bounce Rate
                </div>
            </div>

            <div class="bg-zinc-950 p-6 relative flex flex-col">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Activity</span>
                    <button data-info-title="24h Heatmap" data-info-body="Visualisiert die Server-Last pro Stunde. Hilft Lastspitzen zu erkennen." class="info-btn text-zinc-800 hover:text-zinc-400 transition-colors">
                        <i data-lucide="info" class="w-3 h-3"></i>
                    </button>
                </div>
                <div class="flex items-end gap-0.5 h-8 mt-1">
                    ${metrics.hourlyTraffic.map((v) => {
											const h = Math.max(10, (v / Math.max(...metrics.hourlyTraffic, 1)) * 100);
											return html`<div class="flex-1 bg-zinc-800 rounded-px" style="height: ${h}%"></div>`;
										})}
                </div>
                <div class="mt-auto pt-4 text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">
                    Pulse Rate
                </div>
            </div>
        </div>

        ${metrics.systemHealth
					? html`
            <!-- System Health Section -->
            <div class="mb-12">
                <div class="flex justify-between items-center mb-8">
                    <h3 class="text-xs font-bold text-white uppercase tracking-widest">Infrastructure Intelligence</h3>
                    <button data-info-title="System Health" data-info-body="Aggregiert Daten aus system.log. Latenz zeigt die durchschnittliche Verarbeitungszeit pro Request. Resilience bewertet die Gesamtstabilität des Servers (2xx/3xx Status Codes)." class="info-btn text-zinc-800 hover:text-zinc-400 transition-colors">
                        <i data-lucide="info" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-900 border border-zinc-900 rounded-lg overflow-hidden shadow-sm">
                    <div class="bg-zinc-950 p-6 flex flex-col group">
                        <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Latency</span>
                        <div class="text-3xl font-light text-white tracking-tight">${metrics.systemHealth.avgLatency}<span class="text-xs text-zinc-600 ml-1">ms</span></div>
                        <div class="mt-auto pt-4 text-[9px] font-bold text-zinc-600 uppercase tracking-tighter flex items-center justify-between">
                            <span>AVG RESPONSE</span>
                            <span class="${metrics.systemHealth.avgLatency < 50 ? 'text-emerald-500' : metrics.systemHealth.avgLatency < 200 ? 'text-amber-500' : 'text-rose-500'} font-mono">${metrics.systemHealth.avgLatency < 100 ? 'OPTIMAL' : 'DEGRADED'}</span>
                        </div>
                    </div>
                    <div class="bg-zinc-950 p-6 flex flex-col">
                        <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Resilience</span>
                        <div class="text-3xl font-light text-white tracking-tight">${metrics.systemHealth.successRate}%</div>
                        <div class="mt-auto pt-4 text-[9px] font-bold text-zinc-600 uppercase tracking-tighter flex items-center justify-between">
                            <span>AVAILABILITY GRADE</span>
                            <span class="text-zinc-400 font-mono">${metrics.systemHealth.successRate > 99 ? 'L3' : 'L2'}</span>
                        </div>
                    </div>
                    <div class="bg-zinc-950 p-6 flex flex-col">
                        <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Error Rate</span>
                        <div class="text-3xl font-light ${metrics.systemHealth.errorRate > 5 ? "text-rose-500" : "text-white"} tracking-tight">${metrics.systemHealth.errorRate}%</div>
                        <div class="mt-auto pt-4 text-[9px] font-bold text-zinc-600 uppercase tracking-tighter flex items-center justify-between">
                            <span>NON-2XX RESPONSES</span>
                            <span class="font-mono text-zinc-400 uppercase">${Object.keys(metrics.systemHealth.statusCodes).length} TYPES</span>
                        </div>
                    </div>
                </div>
            </div>
            `
					: ""}

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
            <!-- Path List -->
            <div class="lg:col-span-2">
                <div class="flex justify-between items-center mb-8">
                    <h3 class="text-xs font-bold text-white uppercase tracking-widest">Trending Resources</h3>
                    <button data-info-title="Ressourcen-Analyse" data-info-body="Zeigt die meistbesuchten Pfade. Graue Balken stehen für das Frontend, dunklere für API-Endpunkte. Hilft bei der Identifikation von Hotspots." class="info-btn text-zinc-800 hover:text-zinc-400 transition-colors">
                        <i data-lucide="info" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    ${metrics.topPaths.map((p) => {
											const perc = Math.round((p.count / metrics.totalViews) * 100);
											return html`
                            <div class="group">
                                <div class="flex justify-between text-[10px] font-medium mb-2">
                                    <span class="${p.isApi ? "text-zinc-600" : "text-zinc-300"} font-mono truncate max-w-[180px]">${p.path}</span>
                                    <span class="text-zinc-500 font-mono">${p.count} <span class="text-[8px] opacity-40 ml-1">HITS</span></span>
                                </div>
                                <div class="h-0.5 w-full bg-zinc-900 overflow-hidden">
                                    <div class="h-full ${p.isApi ? "bg-zinc-700" : "bg-zinc-400"} opacity-50 group-hover:opacity-100 transition-all duration-700" style="width: ${perc}%"></div>
                                </div>
                            </div>
                        `;
										})}
                </div>
            </div>

            <!-- Infrastructure Stats -->
            <div>
                <div class="flex justify-between items-center mb-8">
                    <h3 class="text-xs font-bold text-white uppercase tracking-widest">Client Ecosystem</h3>
                    <button data-info-title="Infrastruktur-Analyse" data-info-body="Detaillierte Aufschlüsselung der Client-Umgebungen. 'Platforms' zeigt Desktop vs Mobile, während 'OS' und 'Browsers' die spezifischen Systeme identifizieren." class="info-btn text-zinc-800 hover:text-zinc-400 transition-colors">
                        <i data-lucide="info" class="w-4 h-4"></i>
                    </button>
                </div>
                
                <div class="space-y-8">
                    <div class="space-y-3">
                        <span class="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">Platforms</span>
                        ${metrics.deviceStats.map(
													(s) => html`
                            <div class="flex items-center justify-between text-[11px]">
                                <span class="text-zinc-400 font-medium">${s.label}</span>
                                <span class="text-zinc-600 font-mono">${s.value}</span>
                            </div>
                        `,
												)}
                    </div>

                    <div class="space-y-3">
                        <span class="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">Operating Systems</span>
                        ${metrics.osStats.slice(0, 4).map(
													(s) => html`
                            <div class="flex items-center justify-between text-[11px]">
                                <span class="text-zinc-400 font-medium">${s.label}</span>
                                <span class="text-zinc-600 font-mono">${s.value}</span>
                            </div>
                        `,
												)}
                    </div>

                    <div class="space-y-3">
                        <span class="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">Top Browsers</span>
                        ${metrics.browserStats.map(
													(s) => html`
                            <div class="flex items-center justify-between text-[11px]">
                                <span class="text-zinc-400 font-medium">${s.label}</span>
                                <span class="text-zinc-600 font-mono">${s.value}</span>
                            </div>
                        `,
												)}
                    </div>
                </div>
            </div>
        </div>

        <!-- Event Table -->
        <div class="mt-16 bg-zinc-950 border border-zinc-900 rounded-lg overflow-hidden">
            <div class="px-8 py-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/10">
                <div class="flex items-center gap-3">
                    <h3 class="text-[11px] font-bold text-white uppercase tracking-widest">Live Feed</h3>
                    <button data-info-title="Echtzeit-Ereignisprotokoll" data-info-body="Dies ist eine ungefilterte oder teilgefilterte Ansicht der letzten 50 Server-Events. Technisches Rauschen (wie Service Worker, Manifeste oder statische Assets) wird bei aktiver Filterung transparent dargestellt oder ganz ausgeblendet, um den Fokus auf tatsächliche Nutzerinteraktionen zu legen. Jeder Eintrag verrät Zeitstempel, anonymisierten UserHash, Event-Typ (z.B. Seitenzugriff), den Zielpfad und das Betriebssystem des Clients." class="info-btn text-zinc-800 hover:text-zinc-400 transition-colors">
                        <i data-lucide="info" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
                <span class="text-[9px] font-bold text-zinc-600 tracking-tighter">ROLLING 50 LOGS</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-[11px] border-collapse">
                    <thead>
                        <tr class="text-zinc-600 uppercase tracking-tighter bg-zinc-950">
                            <th class="p-5 pl-8 font-bold border-b border-zinc-900">Timestamp</th>
                            <th class="p-5 font-bold border-b border-zinc-900">User ID</th>
                            <th class="p-5 font-bold border-b border-zinc-900">Activity</th>
                            <th class="p-5 font-bold border-b border-zinc-900">Resource</th>
                            <th class="p-5 pr-8 text-right font-bold border-b border-zinc-900">Platform</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-zinc-900">
                        ${metrics.recentEvents.map((e) => {
													const noise = isTechNoise(e.path);
													return html`
                            <tr class="hover:bg-zinc-900/50 group transition-colors ${noise ? "opacity-30" : ""}">
                                <td class="p-5 pl-8 font-mono text-zinc-500">${new Date(e.time).toLocaleTimeString()}</td>
                                <td class="p-5"><span class="text-zinc-500 font-mono text-[9px]">${e.userHash.substring(0, 12)}...</span></td>
                                <td class="p-5"><span class="px-2 py-0.5 rounded-sm border border-zinc-800 text-zinc-300 text-[9px] font-bold">${e.event}</span></td>
                                <td class="p-5 font-mono ${e.path.startsWith("/api") ? "text-zinc-500" : "text-zinc-300"}">${e.path}</td>
                                <td class="p-5 pr-8 text-right text-zinc-500 font-bold uppercase text-[9px] tracking-widest">${e.os}</td>
                            </tr>
                        `;
												})}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        lucide.createIcons();
        
        const modal = document.getElementById('infoModal');
        const modalContent = modal.querySelector('.modal-content');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        function showInfo(title, body) {
            modalTitle.innerText = title;
            modalBody.innerHTML = body;
            modal.classList.remove('hidden');
            // Minimaler Delay für Animation
            setTimeout(() => {
                modalContent.classList.remove('opacity-0', 'scale-95');
            }, 10);
        }

        function closeModal() {
            modalContent.classList.add('opacity-0', 'scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 200);
        }

        document.querySelectorAll('.info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                showInfo(btn.getAttribute('data-info-title'), btn.getAttribute('data-info-body'));
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    </script>
</body>
</html>
`);
});

export { adminRouter };
