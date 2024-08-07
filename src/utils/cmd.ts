import { Command } from '@tauri-apps/api/shell';
import logStore from '~/stores/logs';

export class CommandError extends Error {
  constructor(
    message: string,
    public code?: number | null,
  ) {
    super(message);
  }
  name = 'CommandError';
  static is(error: unknown): error is CommandError {
    return error instanceof CommandError;
  }
}

const getChildPids = async (pid: number): Promise<number[]> => {
  const cmd = new Command('pgrep', ['-P', pid.toString()]);
  const { code, stdout } = await cmd.execute();
  if (code !== 0) return [pid];

  const childPids = stdout.trim().split('\n').map(Number).filter(Number.isFinite);

  if (childPids.length === 0) return [pid];

  const recursivePids = await Promise.all(childPids.map(getChildPids));
  return [...new Set([pid, ...childPids, ...recursivePids.flat()])];
};

const killProcessAndChildren = async (pid: number) => {
  const pids = await getChildPids(pid);
  const unkilled = (
    await Promise.allSettled(pids.map((pid) => new Command('kill', ['-SIGINT', pid.toString()]).execute()))
  ).filter((res) => res.status === 'rejected');
  if (unkilled.length > 0) throw new Error('Failed to kill all child processes');
};

export interface StreamCommandOptions<T = string> {
  onStdout?: (data: T) => void;
  onStderr?: (data: T) => void;
  onClose?: (...args: unknown[]) => void;
  onError?: (error: unknown) => void;
  signal?: AbortSignal;
  logs?: true;
}
export function streamCommand(cmd: Command, options?: StreamCommandOptions): Promise<[string, string]> {
  return new Promise((resolve, reject) => {
    let stdout = '',
      stderr = '',
      cleanup = () => void 0;
    cmd.stdout.on('data', (data: string) => {
      options?.onStdout?.(data);
      stdout += data;
    });
    cmd.stderr.on('data', (data: string) => {
      options?.onStderr?.(data);
      stderr += data;
    });
    cmd.on('close', (...args: unknown[]) => {
      options?.onClose?.(...args);
      cmd.removeAllListeners();
      cmd.stdout.removeAllListeners();
      cmd.stderr.removeAllListeners();
      cleanup();
      resolve([stdout, stderr]);
    });
    cmd.on('error', (error: unknown) => {
      options?.onError?.(error);
      cmd.removeAllListeners();
      cmd.stdout.removeAllListeners();
      cmd.stderr.removeAllListeners();
      cleanup();
      reject(error);
    });
    cmd
      .spawn()
      .then((child) => {
        const abortListener = () => {
          killProcessAndChildren(child.pid).catch((e: unknown) => console.error(e));
          options?.signal?.removeEventListener('abort', abortListener);
          reject(new CommandError('Aborted'));
        };
        options?.signal?.addEventListener('abort', abortListener);
        cleanup = () => {
          options?.signal?.removeEventListener('abort', abortListener);
        };
      })
      .catch((error: unknown) => {
        if (CommandError.is(error)) reject(error);
        else if (error instanceof Error) {
          const e = new CommandError(error.message);
          e.stack = error.stack;
          reject(e);
        } else {
          console.error(error);
          reject(new CommandError('Unknown error'));
        }
      });
  });
}

export function executeCommand(
  name: string,
  command: Command,
  options?: Pick<StreamCommandOptions, 'signal' | 'logs'>,
): Promise<[string, string]> {
  return streamCommand(command, {
    ...options,
    onStderr: options?.logs && ((d) => logStore.addLog(name, d, 'error')),
    onStdout: options?.logs && ((d) => logStore.addLog(name, d)),
  });
}
