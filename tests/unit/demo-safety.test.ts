import { describe, it, expect } from 'vitest';
import { isPrivateOrReservedIp } from '@/lib/demo/safety';

describe('Demo URL Safety & SSRF Protection', () => {
  it('blocks loopback IPv4 addresses (127.0.0.1, 127.0.0.2)', () => {
    expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('127.0.0.254')).toBe(true);
  });

  it('blocks loopback IPv6 (::1)', () => {
    expect(isPrivateOrReservedIp('::1')).toBe(true);
  });

  it('blocks private class A, B, C IPs', () => {
    // 10.0.0.0/8
    expect(isPrivateOrReservedIp('10.0.1.5')).toBe(true);
    // 172.16.0.0/12
    expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('172.31.255.255')).toBe(true);
    // 192.168.0.0/16
    expect(isPrivateOrReservedIp('192.168.1.1')).toBe(true);
  });

  it('blocks cloud metadata endpoint (169.254.169.254)', () => {
    expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true);
  });

  it('allows safe public IPs', () => {
    expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false);
    expect(isPrivateOrReservedIp('1.1.1.1')).toBe(false);
    expect(isPrivateOrReservedIp('140.82.112.4')).toBe(false); // GitHub IP
  });
});
