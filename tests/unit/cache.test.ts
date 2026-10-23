import { describe, it, expect } from 'vitest';
import { serverCache } from '@/lib/cache/memoryCache';

describe('Server In-Memory Cache & Deduplication', () => {
  it('應該能正確快取與讀取資料', () => {
    serverCache.set('test-key', { val: 42 }, 10);
    const cached = serverCache.get<{ val: number }>('test-key');
    expect(cached?.val).toBe(42);
  });

  it('過期快取應該回傳 undefined', async () => {
    serverCache.set('expire-key', 'hello', 0.001); // 1ms
    await new Promise((r) => setTimeout(r, 10));
    expect(serverCache.get('expire-key')).toBeUndefined();
  });

  it('fetchOrDedupe 應該合併併發請求，避免重複呼叫 fetcher', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 20));
      return 'done';
    };

    const [res1, res2] = await Promise.all([
      serverCache.fetchOrDedupe('dedupe-test', fetcher, 5),
      serverCache.fetchOrDedupe('dedupe-test', fetcher, 5),
    ]);

    expect(res1).toBe('done');
    expect(res2).toBe('done');
    expect(callCount).toBe(1); // 只有 1 次真實調用！
  });
});
