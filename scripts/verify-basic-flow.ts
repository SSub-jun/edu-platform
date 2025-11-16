/* tsx scripts/verify-basic-flow.ts */
import { HttpClient } from './util/http';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';
const USER = process.env.V_USER ?? 'user';
const PASS = process.env.V_PASS ?? 'user123';

function logOk(label: string, extra?: string) { console.log(`✅ ${label}${extra ? ' - ' + extra : ''}`); }
function logFail(label: string, status?: number, body?: any) {
  console.error(`❌ ${label} ${status ? `(status ${status})` : ''}`);
  if (body) console.error(typeof body === 'string' ? body.slice(0, 500) : JSON.stringify(body).slice(0, 500));
}
function expectStatus(status: number, allowed: number[]) { return allowed.includes(status); }

async function main() {
  const http = new HttpClient({ baseUrl: BASE_URL });

  // a) health/docs
  let r = await http.get('/health');
  if (!expectStatus(r.status, [200])) return logFail('health', r.status, r.json), process.exit(1);
  logOk('health');

  r = await http.get('/docs');
  if (!expectStatus(r.status, [200, 301, 302])) return logFail('docs', r.status, r.text), process.exit(1);
  logOk('docs');

  // b) login
  r = await http.post('/auth/login', { username: USER, password: PASS });
  if (!expectStatus(r.status, [200, 201]) || !r.json?.accessToken) return logFail('login', r.status, r.json), process.exit(1);
  const accessToken = r.json.accessToken as string;
  logOk('login', `token.len=${accessToken.length}`);
  const authHeader = { Authorization: `Bearer ${accessToken}` };

  // c) curriculum
  r = await http.get('/me/curriculum', authHeader);
  if (!expectStatus(r.status, [200])) return logFail('me/curriculum', r.status, r.json), process.exit(1);
  const items = r.json?.data ?? [];
  if (!Array.isArray(items) || items.length < 1) return logFail('curriculum empty'), process.exit(1);
  const first = items[0];
  if (!first.lessons?.length) return logFail('no lessons in curriculum'), process.exit(1);
  const lessonId = first.lessons[0].id;
  logOk('curriculum', `lessonId=${lessonId}`);

  // d) lesson status
  r = await http.get(`/progress/lessons/${encodeURIComponent(lessonId)}/status`, authHeader);
  if (!expectStatus(r.status, [200, 403, 404])) return logFail('lesson status', r.status, r.json), process.exit(1);
  logOk('lesson status', `status=${r.status}`);
  let reached90 = false;

  // e) ping loop (up to 15)
  for (let i = 0; i < 15; i++) {
    const ping = await http.post('/progress/ping', { lessonId, playedMs: 60000 }, authHeader);
    if (!expectStatus(ping.status, [200, 403, 404])) return logFail('progress ping', ping.status, ping.json), process.exit(1);
    const st = await http.get(`/progress/lessons/${encodeURIComponent(lessonId)}/status`, authHeader);
    if (!expectStatus(st.status, [200, 403, 404])) return logFail('status after ping', st.status, st.json), process.exit(1);
    const pct = st.json?.progressPercent ?? st.json?.data?.progressPercent ?? 0;
    console.log(`   progress=${pct}`);
    if (st.status === 200 && pct >= 90) { reached90 = true; break; }
    if (st.status === 403) break; // period/assignment guard → stop
  }
  logOk('ping loop', reached90 ? '>=90' : '<90 or guard');

  // f) start exam
  const start = await http.post(`/exam/lessons/${encodeURIComponent(lessonId)}/start`, {}, authHeader);
  if (start.status === 422) {
    logOk('exam start expected 422 (PROGRESS_NOT_ENOUGH or similar)');
    console.log('✅ Verified: basic implemented features OK');
    return;
  }
  if (!expectStatus(start.status, [200, 403, 404])) return logFail('exam start', start.status, start.json), process.exit(1);
  const attemptId = start.json?.data?.attemptId ?? start.json?.attemptId;
  const questions = start.json?.data?.questions ?? start.json?.questions ?? [];
  if (!attemptId || questions.length !== 10) return logFail('exam payload invalid', undefined, start.json), process.exit(1);
  logOk('exam start', `attemptId=${attemptId}, q=${questions.length}`);

  // g) submit + duplicate 409
  const answers = questions.map((q: any) => ({ questionId: q.id, choiceIndex: 0 }));
  const submit = await http.post(`/exam/attempts/${encodeURIComponent(attemptId)}/submit`, { answers }, authHeader);
  if (!expectStatus(submit.status, [200])) return logFail('exam submit', submit.status, submit.json), process.exit(1);
  logOk('exam submit', `score=${submit.json?.data?.examScore ?? submit.json?.examScore}`);

  const dup = await http.post(`/exam/attempts/${encodeURIComponent(attemptId)}/submit`, { answers }, authHeader);
  if (!expectStatus(dup.status, [409])) return logFail('exam duplicate submission expected 409', dup.status, dup.json), process.exit(1);
  logOk('exam duplicate 409');

  // h) retake → ATTEMPT_NOT_CLOSED 422 기대
  const retake = await http.post(`/exam/lessons/${encodeURIComponent(lessonId)}/retake`, {}, authHeader);
  if (!expectStatus(retake.status, [422])) return logFail('exam retake expected 422', retake.status, retake.json), process.exit(1);
  logOk('exam retake 422');

  console.log('✅ Verified: basic implemented features OK');
}

main().catch((e) => {
  console.error('❌ verify-basic-flow failed', e);
  process.exit(1);
});














