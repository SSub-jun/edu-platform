import axios from 'axios';

const BASE = process.argv[2] || process.env.API_BASE || 'http://localhost:4000';

async function assertStatus(fn: () => Promise<any>, expect: number | number[], label: string) {
  const codes = Array.isArray(expect) ? expect : [expect];
  try {
    const res = await fn();
    if (!codes.includes(res.status)) {
      throw new Error(`${label}: expected ${codes} got ${res.status}`);
    }
    return res;
  } catch (e: any) {
    if (e.response && codes.includes(e.response.status)) return e.response;
    throw new Error(`${label} failed: ${e.message}`);
  }
}

async function main() {
  // health
  await assertStatus(() => axios.get(`${BASE}/health`), 200, 'health');

  // docs
  await assertStatus(() => axios.get(`${BASE}/docs`, { maxRedirects: 0, validateStatus: () => true }), [200, 302, 301], 'docs');

  // login
  const login = await axios.post(`${BASE}/auth/login`, { username: 'user', password: 'user123' }, { validateStatus: () => true });
  if (login.status !== 201 && login.status !== 200) throw new Error(`login failed: ${login.status}`);
  const token = login.data?.accessToken;
  if (!token) throw new Error('no accessToken');

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  // curriculum or status
  await assertStatus(() => axios.get(`${BASE}/progress/subjects/subject-math/status`, auth), 200, 'subject status');

  // exam start guard (progress < 90%)
  const startRes = await axios.post(`${BASE}/exam/lessons/lesson-1/start`, {}, { ...auth, validateStatus: () => true });
  if (![200, 422, 403].includes(startRes.status)) throw new Error(`start status unexpected: ${startRes.status}`);
  if (startRes.status === 422 || startRes.status === 403) {
    console.log('guard works:', startRes.status);
  }

  console.log('SMOKE API OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


