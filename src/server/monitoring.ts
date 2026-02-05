import os from "node:os";
import { analyticsLogger } from "../core/logger";

let lastNetworkStats = { rx: 0, tx: 0 };

/**
 * Reads network stats from /proc/net/dev (Linux only)
 * Returns total bytes received and transmitted across all interfaces except loopback
 */
async function getNetworkStats() {
	try {
		const content = await Bun.file("/proc/net/dev").text();
		const lines = content.split("\n");
		let rx = 0;
		let tx = 0;

		for (const line of lines) {
			const parts = line.trim().split(/\s+/);
			const iface = parts[0];
			if (!iface || parts.length < 10 || !iface.includes(":") || iface.startsWith("lo:")) {
				continue;
			}
			// Interface name is parts[0] (e.g., eth0:)
			// Receive bytes is parts[1]
			// Transmit bytes is parts[9]
			rx += Number.parseInt(parts[1] || "0", 10);
			tx += Number.parseInt(parts[9] || "0", 10);
		}
		return { rx, tx };
	} catch (_e) {
		// Fallback for non-linux environments or errors
		return { rx: 0, tx: 0 };
	}
}

async function getMemoryStats() {
	try {
		const content = await Bun.file("/proc/meminfo").text();
		const meminfo: Record<string, number> = {};
		for (const line of content.split("\n")) {
			const parts = line.split(":");
			if (parts.length === 2) {
				const name = parts[0]!.trim();
				const value = Number.parseInt(parts[1]!.trim().split(/\s+/)[0] || "0", 10);
				meminfo[name] = value * 1024; // kB to bytes
			}
		}

		if (meminfo.MemTotal && meminfo.MemAvailable) {
			return {
				total: meminfo.MemTotal,
				free: meminfo.MemAvailable, // Use Available as "free" for more accurate user-facing metrics
				used: meminfo.MemTotal - meminfo.MemAvailable,
			};
		}
	} catch (_e) {
		// Fallback for non-Linux or errors
	}
	const total = os.totalmem();
	const free = os.freemem();
	return { total, free, used: total - free };
}

export async function startMonitoring() {
	// Initialize network stats
	lastNetworkStats = await getNetworkStats();

	setInterval(async () => {
		const mem = await getMemoryStats();
		const totalMem = mem.total;
		const usedMem = mem.used;
		const ramPercent = (usedMem / totalMem) * 100;

		const currentNetworkStats = await getNetworkStats();
		const bytesIn = currentNetworkStats.rx - lastNetworkStats.rx;
		const bytesOut = currentNetworkStats.tx - lastNetworkStats.tx;

		// Update reference for next interval
		lastNetworkStats = currentNetworkStats;

		analyticsLogger.info({
			event: "system_stats",
			cpuLoad: os.loadavg()[0],
			ramUsage: {
				usedMB: Math.round(usedMem / 1024 / 1024),
				totalMB: Math.round(totalMem / 1024 / 1024),
				percent: Math.round(ramPercent * 100) / 100,
			},
			uptime: Math.round(os.uptime()),
			network: {
				bytesIn: Math.max(0, bytesIn),
				bytesOut: Math.max(0, bytesOut),
			},
		});
	}, 60000); // 60 seconds
}

/**
 * Efficiently parses the last part of analytics.log to extract monitoring data
 */
export async function getMonitoringData() {
	const logPath = "./analytics.log";
	const file = Bun.file(logPath);

	if (!(await file.exists())) {
		return { latest: null, traffic24h: { in: 0, out: 0 }, averages1h: { cpu: 0, ram: 0 } };
	}

	// Read last 4MB for better 1h data (60 entries * ~500 chars = 30KB, but let's be safe)
	const fileSize = file.size;
	const start = Math.max(0, fileSize - 4 * 1024 * 1024);
	const blob = file.slice(start, fileSize);
	const content = await blob.text();

	const lines = content.split("\n");
	let latest = null;
	let totalIn = 0;
	let totalOut = 0;

	let cpuSum1h = 0;
	let ramSum1h = 0;
	let count1h = 0;

	const now = Date.now();
	const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
	const oneHourAgo = now - 60 * 60 * 1000;

	for (const line of lines) {
		if (!line.trim()) continue;
		try {
			const entry = JSON.parse(line);
			if (entry.event === "system_stats") {
				const entryTime = new Date(entry.time).getTime();

				// Track latest
				if (!latest || entryTime > new Date(latest.time).getTime()) {
					latest = entry;
				}

				// Track 24h traffic
				if (entryTime >= twentyFourHoursAgo) {
					totalIn += entry.network?.bytesIn || 0;
					totalOut += entry.network?.bytesOut || 0;
				}

				// Track 1h averages
				if (entryTime >= oneHourAgo) {
					cpuSum1h += entry.cpuLoad || 0;
					ramSum1h += entry.ramUsage?.percent || 0;
					count1h++;
				}
			}
		} catch (_e) {
			// Skip malformed lines
		}
	}

	return {
		latest,
		traffic24h: {
			in: totalIn,
			out: totalOut,
		},
		averages1h: {
			cpu: count1h > 0 ? cpuSum1h / count1h : 0,
			ram: count1h > 0 ? ramSum1h / count1h : 0,
		},
	};
}
