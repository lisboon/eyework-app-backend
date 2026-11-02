import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const TEST_ENV_FILE = resolve(__dirname, '..', '..', '.env.test');

export function loadTestEnv(): void {
  if (existsSync(TEST_ENV_FILE)) {
    process.loadEnvFile(TEST_ENV_FILE);
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set for the tests. Copy .env.test.example to .env.test.',
    );
  }

  const database = new URL(url).pathname.replace(/^\//, '');
  if (!database.endsWith('_test')) {
    throw new Error(
      `Integration tests drop the "${database}" database. Use a database whose name ends with _test (see .env.test.example).`,
    );
  }
}
