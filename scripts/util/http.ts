/* Minimal fetch wrapper for JSON APIs */
const DEFAULT_TIMEOUT_MS = 15000;

export interface HttpOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeoutMs: number;

  constructor(options: HttpOptions = {}) {
    this.baseUrl = options.baseUrl ?? '';
    this.defaultHeaders = options.headers ?? { 'Content-Type': 'application/json' };
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
      promise.then((res) => { clearTimeout(id); resolve(res); }).catch((err) => { clearTimeout(id); reject(err); });
    });
  }

  private async request(method: string, url: string, body?: any, extraHeaders?: Record<string, string>) {
    const fullUrl = this.baseUrl ? `${this.baseUrl}${url}` : url;
    const headers: Record<string, string> = { ...this.defaultHeaders, ...(extraHeaders ?? {}) };
    const init: RequestInit = { method, headers };
    if (body !== undefined) init.body = typeof body === 'string' ? body : JSON.stringify(body);
    const res = await this.withTimeout(fetch(fullUrl, init), this.timeoutMs);
    const text = await res.text();
    let json: any = undefined;
    try { json = text ? JSON.parse(text) : undefined; } catch {}
    return { status: res.status, ok: res.ok, json, text };
  }

  get(url: string, headers?: Record<string, string>) { return this.request('GET', url, undefined, headers); }
  post(url: string, body?: any, headers?: Record<string, string>) { return this.request('POST', url, body, headers); }
  patch(url: string, body?: any, headers?: Record<string, string>) { return this.request('PATCH', url, body, headers); }
}














