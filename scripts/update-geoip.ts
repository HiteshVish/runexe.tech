/**
 * Download DB-IP country lite MMDB (same source as legacy bin/update-geoip.php).
 * Run: npm run update-geoip
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const DEST = path.join(process.cwd(), "lib/invoice/data/dbip-country-lite.mmdb");
const URL =
  process.env.GEOIP_DOWNLOAD_URL ||
  "https://download.db-ip.com/free/dbip-country-lite-2025-03.mmdb.gz";

async function main() {
  console.log("Fetching GeoIP database from", URL);
  const res = await fetch(URL);
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(DEST), { recursive: true });
  if (URL.endsWith(".gz")) {
    const { gunzipSync } = await import("zlib");
    writeFile(DEST, gunzipSync(buf));
  } else {
    await writeFile(DEST, buf);
  }
  console.log("Wrote", DEST);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});