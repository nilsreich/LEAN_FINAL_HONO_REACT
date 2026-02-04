import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { html } from "hono/html";
import { getMonitoringData } from "./monitoring";

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
	peakUsers: { count: number; time: string };
	sessionDurationDist: { short: number; medium: number; long: number };
	topPaths: { path: string; count: number; isApi: boolean }[];
	deviceStats: { label: string; value: number; percent: number }[];
	osStats: { label: string; value: number; percent: number }[];
	browserStats: { label: string; value: number; percent: number }[];
	hourlyTraffic: number[];
	recentEvents: PinoLogEntry[];
	systemHealth?: {
		avgLatency: number;
		errorRate: number;
		successRate: number;
		statusCodes: Record<number, number>;
		slowestPaths: { path: string; avg: number }[];
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
const isTechNoise = (path?: string) => {
	if (!path) return false;
	return NOISE_PATHS.some((re) => re.test(path));
};

// --- DATA PROCESSING ---

async function getAdvancedAnalytics(hideNoise = true): Promise<AnalyticsMetrics | null> {
	try {
		const logPath = "./analytics.log";
		const file = Bun.file(logPath);
		if (!(await file.exists())) return null;

		// Use a slice of the last 4MB for memory efficiency on low-performance VPS
		const fileSize = file.size;
		const startByte = Math.max(0, fileSize - 4 * 1024 * 1024);
		const blob = file.slice(startByte, fileSize);
		const text = await blob.text();
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

		// Infrastructure metrics derived from http_request events in the same log
		let totalLat = 0;
		let errors = 0;
		let totalRequests = 0;
		const codes: Record<number, number> = {};
		const pathLatencies: Record<string, { total: number; count: number }> = {};

		// Exclude system stats and internal requests from core user analytics
		const userEntries: PinoLogEntry[] = [];
		
		for (const entry of allEntries) {
			if (entry.event === "system_stats") continue;
			
			if (entry.event === "http_request") {
				const lat = Number(entry.duration) || 0;
				const status = Number(entry.status) || 0;
				const path = String(entry.path || "unknown");

				totalLat += lat;
				totalRequests++;
				if (status >= 400) errors++;
				codes[status] = (codes[status] || 0) + 1;

				if (!isTechNoise(path)) {
					pathLatencies[path] = pathLatencies[path] || { total: 0, count: 0 };
					const stats = pathLatencies[path]!;
					stats.total += lat;
					stats.count++;
				}
				continue;
			}
			
			userEntries.push(entry);
		}

		// Filter noise for core metrics
		const entries = hideNoise ? userEntries.filter((e) => !isTechNoise(e.path)) : userEntries;

		const userSessions = new Map<string, PinoLogEntry[]>();
		const hourly = new Array(24).fill(0);
		const paths: Record<string, number> = {};
		const browsers: Record<string, number> = {};
		const osMap: Record<string, number> = {};
		const deviceMap: Record<string, number> = {};

		const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
		const activeUsersTemp = new Set<string>();
		const hourlyUsers: Record<number, Set<string>> = {};

		for (const entry of entries) {
			const list = userSessions.get(entry.userHash) || [];
			list.push(entry);
			userSessions.set(entry.userHash, list);

			const time = new Date(entry.time).getTime();
			const hour = new Date(time).getHours();
			hourly[hour]++;

			// Track unique users per hour for peak detection
			hourlyUsers[hour] = hourlyUsers[hour] || new Set();
			hourlyUsers[hour].add(entry.userHash);

			if (time > fiveMinsAgo) activeUsersTemp.add(entry.userHash);

			paths[entry.path] = (paths[entry.path] || 0) + 1;
			browsers[entry.browser] = (browsers[entry.browser] || 0) + 1;
			osMap[entry.os] = (osMap[entry.os] || 0) + 1;
			deviceMap[entry.type] = (deviceMap[entry.type] || 0) + 1;
		}

		let peakHour = 0;
		let peakCount = 0;
		for (const [hour, users] of Object.entries(hourlyUsers)) {
			if (users.size > peakCount) {
				peakCount = users.size;
				peakHour = Number.parseInt(hour, 10);
			}
		}

		let totalSessionSeconds = 0;
		let totalSessions = 0;
		let singleEventSessions = 0;
		const sessionDurations: number[] = [];

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
					const duration = (lastEvent - sessionStart) / 1000;
					totalSessionSeconds += duration;
					sessionDurations.push(duration);
					
					sessionStart = current;
					totalSessions++;
					currentSessionEvents = 1;
				} else {
					currentSessionEvents++;
				}
				lastEvent = current;
			}
			if (currentSessionEvents === 1) singleEventSessions++;
			const finalDuration = (lastEvent - sessionStart) / 1000;
			totalSessionSeconds += finalDuration;
			sessionDurations.push(finalDuration);
		}

		const distribution = {
			short: sessionDurations.filter((d) => d < 60).length, // < 1m
			medium: sessionDurations.filter((d) => d >= 60 && d < 600).length, // 1m - 10m
			long: sessionDurations.filter((d) => d >= 600).length, // > 10m
		};
		const totalDist = distribution.short + distribution.medium + distribution.long || 1;

		const avgSec = totalSessions > 0 ? totalSessionSeconds / totalSessions : 0;
		const engagementScore =
			totalSessions > 0 ? Number((entries.length / totalSessions).toFixed(1)) : 0;
		const bounceRate =
			totalSessions > 0 ? Math.round((singleEventSessions / totalSessions) * 100) : 0;

		// --- SYSTEM HEALTH (now from unified analytics.log) ---
		let systemHealth: AnalyticsMetrics["systemHealth"];
		if (totalRequests > 0) {
			systemHealth = {
				avgLatency: Math.round(totalLat / totalRequests),
				errorRate: Math.round((errors / totalRequests) * 100),
				successRate: Math.round(((totalRequests - errors) / totalRequests) * 100),
				statusCodes: codes,
				slowestPaths: Object.entries(pathLatencies)
					.map(([path, data]) => ({ path, avg: Math.round(data.total / data.count) }))
					.sort((a, b) => b.avg - a.avg)
					.filter((p) => !isTechNoise(p.path))
					.slice(0, 3),
			};
		}

		return {
			totalViews: entries.length,
			uniqueUsers: userSessions.size,
			avgSessionTime: `${Math.floor(avgSec / 60)}m ${Math.floor(avgSec % 60)}s`,
			engagementScore,
			bounceRate,
			activeNow: activeUsersTemp.size,
			peakUsers: { count: peakCount, time: `${peakHour}:00 - ${peakHour}:59` },
			sessionDurationDist: {
				short: Math.round((distribution.short / totalDist) * 100),
				medium: Math.round((distribution.medium / totalDist) * 100),
				long: Math.round((distribution.long / totalDist) * 100),
			},
			hourlyTraffic: hourly,
			topPaths: Object.entries(paths)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5)
				.map(([path, count]) => ({ path, count, isApi: path.startsWith("/api") })),
			deviceStats: Object.entries(deviceMap).map(([label, value]) => ({
				label,
				value,
				percent: Math.round((value / entries.length) * 100),
			})),
			osStats: Object.entries(osMap).map(([label, value]) => ({
				label,
				value,
				percent: Math.round((value / entries.length) * 100),
			})),
			browserStats: Object.entries(browsers)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 3)
				.map(([label, value]) => ({
					label,
					value,
					percent: Math.round((value / entries.length) * 100),
				})),
			recentEvents: userEntries
				.filter((e) => e.userHash) // Defensive against any entries without hash
				.slice(-50)
				.reverse(),
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
	const [metrics, monitoringData] = await Promise.all([
		getAdvancedAnalytics(filter === "real"),
		getMonitoringData(),
	]);

	if (!metrics) return c.html(html`<h1>No logs found. Visit the app first!</h1>`);

	const ramPercent = monitoringData.latest?.ramUsage?.percent || 0;
	const ramColorClass =
		ramPercent < 70 ? "bg-green-500" : ramPercent < 85 ? "bg-yellow-500" : "bg-red-500";
	const cpuWarning = (monitoringData.latest?.cpuLoad || 0) > 1.0;

	const formatBytes = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
		return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
	};

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

        <!-- Server Health -->
        <section class="mb-12">
            <div class="flex items-center gap-3 mb-6">
                <h2 class="text-[11px] font-bold text-white uppercase tracking-[0.3em]">Server Health</h2>
                <div class="h-px flex-1 bg-zinc-900/50"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- RAM Usage -->
                <div class="bg-zinc-950 border border-zinc-900 p-5 rounded-lg group hover:border-zinc-800 transition-colors">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-2">
                             <i data-lucide="cpu" class="w-3 h-3 text-zinc-600"></i>
                             <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">RAM Usage</span>
                        </div>
                        <button data-info-title="RAM-Details" data-info-body="Aktuelle Auslastung: ${ramPercent}%. <br/>Durchschnitt (1h): ${monitoringData.averages1h.ram.toFixed(1)}%. <br/><br/>Ein hoher RAM-Verbrauch führt zu vermehrtem Paging (Swapping) auf die Festplatte, was die Performance massiv drosselt. Bei Werten dauerhaft über 85% sollte ein Upgrade des VPS in Erwägung gezogen werden." class="info-btn text-zinc-800 hover:text-zinc-400 transition-colors">
                            <i data-lucide="info" class="w-3 h-3"></i>
                        </button>
                    </div>
                    <div class="flex justify-between items-end mb-2">
                        <span class="text-[10px] font-mono text-zinc-300">${monitoringData.latest?.ramUsage?.usedMB || 0} / ${monitoringData.latest?.ramUsage?.totalMB || 0} MB</span>
                        <span class="text-[9px] font-mono text-zinc-600">AVG (1h): ${monitoringData.averages1h.ram.toFixed(1)}%</span>
                    </div>
                    <div class="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div class="h-full rounded-full ${ramColorClass} transition-all duration-1000" style="width: ${ramPercent}%"></div>
                    </div>
                    <p class="text-[9px] text-zinc-600 mt-3 italic leading-relaxed">Physische Speicherauslastung des VPS. <br/> <span class="opacity-50">Grün (<70%), Gelb (70-85%), Rot (>85%)</span></p>
                </div>

                <!-- CPU Load -->
                <div class="bg-zinc-950 border border-zinc-900 p-5 rounded-lg group hover:border-zinc-800 transition-colors">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-2">
                             <i data-lucide="activity" class="w-3 h-3 text-zinc-600"></i>
                             <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">CPU Load (1m)</span>
                        </div>
                        <button data-info-title="CPU-Metriken" data-info-body="Aktueller Load (1m): ${monitoringData.latest?.cpuLoad?.toFixed(2) || "0.00"}. <br/>Durchschnitt (1h): ${monitoringData.averages1h.cpu.toFixed(2)}. <br/><br/>Load: >1.0 bedeutet Warteschlangen bei der CPU-Verarbeitung (bei 1 Kern). Wenn der 1h-Durchschnitt dauerhaft über 1.0 liegt, ist das System überlastet." class="info-btn text-zinc-800 hover:text-zinc-400 transition-colors">
                            <i data-lucide="info" class="w-3 h-3"></i>
                        </button>
                    </div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-xs font-mono ${cpuWarning ? "text-red-500 font-bold" : "text-zinc-300"}">${monitoringData.latest?.cpuLoad?.toFixed(2) || "0.00"}</span>
                        <span class="text-[9px] font-mono text-zinc-600">AVG (1h): ${monitoringData.averages1h.cpu.toFixed(2)}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        ${cpuWarning ? html`<div class="flex items-center gap-1.5 text-[9px] text-red-500 font-bold uppercase tracking-tighter">
                            <span class="relative flex h-2 w-2">
                              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            High Load Warning
                        </div>` : html`<div class="text-[9px] text-emerald-500/80 font-bold uppercase tracking-tighter">System Healthy</div>`}
                    </div>
                    <p class="text-[9px] text-zinc-600 mt-3 italic leading-relaxed">Durchschnittliche CPU-Last der letzten Minute. <br/> <span class="opacity-50">Last > 1.0 bedeutet Warteschlangen bei der CPU.</span></p>
                </div>

                <!-- Network Traffic -->
                <div class="bg-zinc-950 border border-zinc-900 p-5 rounded-lg group hover:border-zinc-800 transition-colors">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-2">
                             <i data-lucide="zap" class="w-3 h-3 text-zinc-600"></i>
                             <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Traffic (24h)</span>
                        </div>
                        <button data-info-title="Netzwerk-Traffic" data-info-body="Inbound (Download): ${formatBytes(monitoringData.traffic24h.in)} <br/>Outbound (Upload): ${formatBytes(monitoringData.traffic24h.out)} <br/><br/>Dies ist der kumulierte Wert der letzten 24 Stunden. Nützlich zur Überwachung des Inklusiv-Traffics Ihres VPS-Anbieters." class="info-btn text-zinc-800 hover:text-zinc-400 transition-colors">
                            <i data-lucide="info" class="w-3 h-3"></i>
                        </button>
                    </div>
                    <div class="flex gap-6">
                        <div class="flex flex-col">
                            <span class="text-[8px] text-zinc-600 uppercase font-black tracking-tighter mb-1">Incoming</span>
                            <span class="text-[13px] font-mono text-zinc-300">${formatBytes(monitoringData.traffic24h.in)}</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[8px] text-zinc-600 uppercase font-black tracking-tighter mb-1">Outgoing</span>
                            <span class="text-[13px] font-mono text-zinc-300">${formatBytes(monitoringData.traffic24h.out)}</span>
                        </div>
                    </div>
                    <p class="text-[9px] text-zinc-600 mt-3 italic leading-relaxed">Kumulierter Netzwerkverkehr der letzten 24 Stunden. <br/> <span class="opacity-50">Erfasst über alle aktiven Netzwerk-Interfaces.</span></p>
                </div>
            </div>
        </section>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-zinc-900 border border-zinc-900 rounded-lg overflow-hidden mb-12">
            <div class="bg-zinc-950 p-6 relative flex flex-col group">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Growth</span>
                    <button data-info-title="Besucher-Metriken" data-info-body="Unique Users zählt die eindeutigen Identitäten pro Tag. <br/><br/><b>Peak Activity:</b> <br/>Am meisten war los um <b>${metrics.peakUsers.time}</b> mit <b>${metrics.peakUsers.count}</b> gleichzeitigen Nutzern." class="info-btn text-zinc-800 hover:text-zinc-400 transition-colors">
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
                    <button data-info-title="Sitzungs-Qualität" data-info-body="Die durchschnittliche Verweildauer gibt an, wie lange ein Nutzer pro Session aktiv ist. <br/><br/><b>Verteilung:</b><br/>Short (&lt;1m): ${metrics.sessionDurationDist.short}%<br/>Medium (1-10m): ${metrics.sessionDurationDist.medium}%<br/>Long (&gt;10m): ${metrics.sessionDurationDist.long}%" class="info-btn text-zinc-800 hover:text-zinc-400 transition-colors">
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

        ${
					metrics.systemHealth
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
                            <span class="${metrics.systemHealth.avgLatency < 50 ? "text-emerald-500" : metrics.systemHealth.avgLatency < 200 ? "text-amber-500" : "text-rose-500"} font-mono">${metrics.systemHealth.avgLatency < 100 ? "OPTIMAL" : "DEGRADED"}</span>
                        </div>
                    </div>
                    <div class="bg-zinc-950 p-6 flex flex-col">
                        <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Resilience</span>
                        <div class="text-3xl font-light text-white tracking-tight">${metrics.systemHealth.successRate}%</div>
                        <div class="mt-auto pt-4 text-[9px] font-bold text-zinc-600 uppercase tracking-tighter flex items-center justify-between">
                            <span>AVAILABILITY GRADE</span>
                            <span class="text-zinc-400 font-mono">${metrics.systemHealth.successRate > 99 ? "L3" : "L2"}</span>
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
						: ""
				}

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
                                <span class="text-zinc-600 font-mono">${s.percent}%</span>
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
                                <span class="text-zinc-600 font-mono">${s.percent}%</span>
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
                                <span class="text-zinc-600 font-mono">${s.percent}%</span>
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
													const noise = isTechNoise(e.path || "");
													return html`
                            <tr class="hover:bg-zinc-900/50 group transition-colors ${noise ? "opacity-30" : ""}">
                                <td class="p-5 pl-8 font-mono text-zinc-500">${new Date(e.time).toLocaleTimeString()}</td>
                                <td class="p-5"><span class="text-zinc-500 font-mono text-[9px]">${(e.userHash || "Unknown").substring(0, 12)}...</span></td>
                                <td class="p-5"><span class="px-2 py-0.5 rounded-sm border border-zinc-800 text-zinc-300 text-[9px] font-bold">${e.event}</span></td>
                                <td class="p-5 font-mono ${(e.path || "").startsWith("/api") ? "text-zinc-500" : "text-zinc-300"}">${e.path || "N/A"}</td>
                                <td class="p-5 pr-8 text-right text-zinc-500 font-bold uppercase text-[9px] tracking-widest">${e.os || "SYSTEM"}</td>
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
