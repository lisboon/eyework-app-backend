import { execSync } from 'node:child_process';
import { loadTestEnv } from './test-env';

export default function globalSetup(): void {
  loadTestEnv();

  try {
    execSync('pnpm exec prisma migrate reset --force', {
      env: process.env,
      stdio: 'pipe',
    });
  } catch (error) {
    const { stdout, stderr } = error as { stdout?: Buffer; stderr?: Buffer };
    const output = `${stdout?.toString() ?? ''}${stderr?.toString() ?? ''}`;
    throw new Error(
      `Could not prepare the test database. Is it running? Run: docker compose up -d --wait db-test\n\n${output}`,
      { cause: error },
    );
  }
}
