export function corsOriginsFromEnv(env: NodeJS.ProcessEnv): string[] {
  const origins = (env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin !== '');

  if (origins.length === 0 || !origins.every(isOrigin)) {
    throw new Error(
      'CORS_ORIGINS must list origins such as https://app.example.com, separated by commas.',
    );
  }
  return origins;
}

function isOrigin(value: string): boolean {
  if (!URL.canParse(value)) {
    return false;
  }
  const url = new URL(value);
  return (
    (url.protocol === 'https:' || url.protocol === 'http:') &&
    url.origin === value
  );
}
