import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export class SystemRepository {
  md5(buffer: Buffer): string {
    return createHash('md5').update(buffer).digest('hex');
  }

  write(path: string, content: string): void {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }

  append(path: string, content: string): void {
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, content);
  }

  format(repoRoot: string, file: string): void {
    try {
      const output = execFileSync('pnpm', ['exec', 'prettier', '--write', file], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      for (const line of output.split('\n')) {
        if (line.length > 0) {
          console.log(`> ${line}`);
        }
      }
    } catch (error) {
      const stdout = (error as { stdout?: string }).stdout ?? '';
      const stderr = (error as { stderr?: string }).stderr ?? '';
      for (const line of (stdout + stderr).split('\n')) {
        if (line.length > 0) {
          console.log(`> ${line}`);
        }
      }
      throw error;
    }
  }

  async confirm(options?: { prompt?: string; timeoutSeconds: number }): Promise<boolean> {
    if (!process.stdin.isTTY) {
      return true;
    }

    const { prompt, timeoutSeconds = 5 } = options ?? {};

    if (prompt) {
      process.stdout.write(prompt + '\n');
    }

    process.stdout.write(`Continue? [Y/n] (continuing in ${timeoutSeconds}s) `);

    return new Promise((resolve) => {
      const cleanup = () => {
        clearTimeout(timer);
        process.stdin.off('data', onData);
        process.stdin.pause();
      };

      const onData = (chunk: Buffer) => {
        cleanup();
        resolve(!chunk.toString().trim().toLowerCase().startsWith('n'));
      };

      const timer = setTimeout(() => {
        cleanup();
        process.stdout.write('\n');
        resolve(true);
      }, timeoutSeconds * 1000);

      process.stdin.resume();
      process.stdin.once('data', onData);
    });
  }
}
