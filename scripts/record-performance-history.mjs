import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const reportPath = resolve(process.env.RASD_PERF_REPORT ?? "performance-report.json");
const historyPath = resolve(
  process.env.RASD_PERF_HISTORY ?? "performance-history/history.jsonl"
);
if (!existsSync(reportPath)) throw new Error(`performance report missing: ${reportPath}`);
const report = JSON.parse(readFileSync(reportPath, "utf8"));
const samples = Array.isArray(report) ? report : [report];
const latest = samples.reduce(
  (best, item) =>
    Number(item.firstLoad?.loadEventEnd ?? item.loadEventEnd ?? 0) >
    Number(best.firstLoad?.loadEventEnd ?? best.loadEventEnd ?? 0)
      ? item
      : best,
  samples[0]
);
const assets = latest.buildPerformance ?? latest.assets ?? latest;
const record = {
  recordedAt: new Date().toISOString(),
  commit: process.env.GITHUB_SHA ?? process.env.GIT_COMMIT ?? "local",
  ref: process.env.GITHUB_REF_NAME ?? "local",
  firstLoadMs: Number(latest.firstLoad?.loadEventEnd ?? latest.loadEventEnd ?? 0),
  chunkCount: Number(assets.chunkCount ?? 0),
  totalBytes: Number(assets.totalBytes ?? 0),
  largestBytes: Number(assets.largest?.[0]?.bytes ?? 0),
  largestName: assets.largest?.[0]?.name ?? null,
};
mkdirSync(dirname(historyPath), { recursive: true });
appendFileSync(historyPath, `${JSON.stringify(record)}\n`);
writeFileSync(resolve("performance-history/latest.json"), JSON.stringify(record, null, 2));
const previousLines = existsSync(historyPath)
  ? readFileSync(historyPath, "utf8").trim().split("\n").filter(Boolean)
  : [];
const previous = previousLines.length > 1 ? JSON.parse(previousLines.at(-2)) : null;
const delta = previous
  ? {
      firstLoadMs: record.firstLoadMs - previous.firstLoadMs,
      chunkCount: record.chunkCount - previous.chunkCount,
      totalBytes: record.totalBytes - previous.totalBytes,
      largestBytes: record.largestBytes - previous.largestBytes,
    }
  : null;
console.log(JSON.stringify({ record, previous, delta }, null, 2));
