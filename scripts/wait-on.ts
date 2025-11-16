import axios from 'axios';

const url = process.argv[2];
const timeoutMs = parseInt(process.argv[3] || '180000', 10);

if (!url) {
  console.error('Usage: tsx scripts/wait-on.ts <url> [timeoutMs]');
  process.exit(1);
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await axios.get(url, { validateStatus: () => true });
      if (res.status >= 200 && res.status < 500) {
        console.log(`ready: ${url} -> ${res.status}`);
        return process.exit(0);
      }
    } catch {}
    await sleep(1000);
  }
  console.error(`timeout waiting for ${url}`);
  process.exit(1);
}

main();














