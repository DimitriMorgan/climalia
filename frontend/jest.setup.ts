import '@testing-library/jest-dom';

// We use Jest's 'node' test environment (Node 22 has fetch/Headers/Response/Request built-in).
// jsdom would have provided Web Storage, but it strips Node's WHATWG fetch — so to keep
// `Storage.prototype.setItem` spies workable in the auth-store test we install a minimal shim.
class MemoryStorage {
  private readonly store = new Map<string, string>();
  public getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  public setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  public removeItem(key: string): void {
    this.store.delete(key);
  }
  public clear(): void {
    this.store.clear();
  }
  public key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  public get length(): number {
    return this.store.size;
  }
}

const g = globalThis as unknown as Record<string, unknown>;
if (g['Storage'] === undefined) {
  g['Storage'] = MemoryStorage;
}
if (g['localStorage'] === undefined) {
  g['localStorage'] = new MemoryStorage();
}
if (g['sessionStorage'] === undefined) {
  g['sessionStorage'] = new MemoryStorage();
}

// jsdom (used by component tests via per-file @jest-environment docblock) does not expose
// Node's TextEncoder/TextDecoder on its window globals, but react-router/RTL need them.
// Node 22 has them on the module scope — backfill onto the jest jsdom global.
if (g['TextEncoder'] === undefined) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const util = require('node:util') as { TextEncoder: typeof TextEncoder; TextDecoder: typeof TextDecoder };
  g['TextEncoder'] = util.TextEncoder;
  g['TextDecoder'] = util.TextDecoder;
}

// jsdom strips Node's WHATWG fetch primitives (Request/Response/Headers/fetch). Tests that
// build a `Response` to feed to a mocked `global.fetch` need at least Response present.
// We provide a minimal but spec-aligned Response shim covering the surface our `apiFetch`
// reads (status, statusText, ok, json(), headers).
interface ResponseInit {
  status?: number;
  statusText?: string;
  headers?: Record<string, string> | ReadonlyArray<readonly [string, string]>;
}
class MinimalHeaders {
  private readonly map = new Map<string, string>();
  public constructor(init?: Record<string, string> | ReadonlyArray<readonly [string, string]>) {
    if (init === undefined) return;
    const entries: ReadonlyArray<readonly [string, string]> = Array.isArray(init)
      ? (init as ReadonlyArray<readonly [string, string]>)
      : Object.entries(init as Record<string, string>);
    for (const [k, v] of entries) this.map.set(k.toLowerCase(), v);
  }
  public get(name: string): string | null {
    return this.map.get(name.toLowerCase()) ?? null;
  }
  public has(name: string): boolean {
    return this.map.has(name.toLowerCase());
  }
  public set(name: string, value: string): void {
    this.map.set(name.toLowerCase(), value);
  }
}
class MinimalResponse {
  public readonly status: number;
  public readonly statusText: string;
  public readonly ok: boolean;
  public readonly headers: MinimalHeaders;
  private readonly bodyText: string;
  public constructor(body: string | null = null, init: ResponseInit = {}) {
    this.status = init.status ?? 200;
    this.statusText = init.statusText ?? '';
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new MinimalHeaders(init.headers);
    this.bodyText = body ?? '';
  }
  public async json(): Promise<unknown> {
    return JSON.parse(this.bodyText) as unknown;
  }
  public async text(): Promise<string> {
    return this.bodyText;
  }
}
if (g['Response'] === undefined) {
  g['Response'] = MinimalResponse as unknown as typeof Response;
}
if (g['Headers'] === undefined) {
  g['Headers'] = MinimalHeaders as unknown as typeof Headers;
}
