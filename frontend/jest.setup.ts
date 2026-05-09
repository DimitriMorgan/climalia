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
