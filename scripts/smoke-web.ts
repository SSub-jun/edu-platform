import axios from 'axios';

const BASE = process.env.WEB_BASE || 'http://localhost:3000';

async function main() {
  const res = await axios.get(`${BASE}/login`, { maxRedirects: 0, validateStatus: () => true });
  if (![200, 302, 301].includes(res.status)) throw new Error(`web not responding: ${res.status}`);
  console.log('SMOKE WEB OK');
}

main().catch((e) => { console.error(e); process.exit(1); });










