import { readdirSync, statSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const assetsDir = join(root, "dist/public/assets");
const limits = {
  maxChunks: Number(process.env.RASD_MAX_CHUNKS ?? 180),
  maxTotalBytes: Number(process.env.RASD_MAX_TOTAL_JS_BYTES ?? 4_000_000),
  maxLargestBytes: Number(process.env.RASD_MAX_LARGEST_JS_BYTES ?? 650_000),
  maxFirstLoadMs: Number(process.env.RASD_MAX_FIRST_LOAD_MS ?? 2_000),
};
if (!existsSync(assetsDir))
  throw new Error("dist/public/assets is missing; run pnpm build first");
const assets = readdirSync(assetsDir)
  .filter(name => name.endsWith(".js"))
  .map(name => ({ name, bytes: statSync(join(assetsDir, name)).size }))
  .sort((a, b) => b.bytes - a.bytes);
const totalBytes = assets.reduce((sum, asset) => sum + asset.bytes, 0);
const reportPath = process.env.RASD_PERF_REPORT;
if (reportPath && existsSync(reportPath)) {
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  const firstLoad = Math.max(
    ...(Array.isArray(report) ? report : [report]).map(item =>
      Number(item.firstLoad?.loadEventEnd ?? item.loadEventEnd ?? 0)
    )
  );
  if (firstLoad > limits.maxFirstLoadMs)
    throw new Error(
      `first load ${firstLoad}ms exceeds ${limits.maxFirstLoadMs}ms`
    );
}
if (assets.length > limits.maxChunks)
  throw new Error(`chunk count ${assets.length} exceeds ${limits.maxChunks}`);
if (totalBytes > limits.maxTotalBytes)
  throw new Error(
    `total JavaScript ${totalBytes} bytes exceeds ${limits.maxTotalBytes}`
  );
if ((assets[0]?.bytes ?? 0) > limits.maxLargestBytes)
  throw new Error(
    `largest chunk ${assets[0].bytes} bytes exceeds ${limits.maxLargestBytes}`
  );
const result = {
  limits,
  chunkCount: assets.length,
  totalBytes,
  largest: assets.slice(0, 5),
};
if (process.env.RASD_PERF_REPORT)
  writeFileSync(process.env.RASD_PERF_REPORT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
