export function trustProxyFromEnv(env: NodeJS.ProcessEnv): number {
  const value = env.TRUST_PROXY ?? '0';
  if (!/^\d+$/.test(value)) {
    throw new Error(
      `TRUST_PROXY must be the number of proxies in front of the API, such as 0 or 1. Received "${value}".`,
    );
  }
  return Number(value);
}
