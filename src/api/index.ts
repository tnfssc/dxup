import type { UseQueryOptions } from '@tanstack/react-query';
import { Command } from '@tauri-apps/api/shell';

interface Toolchain {
  name: string;
  versions: { version: string; inUse: boolean }[];
}

function parseToolchains(input: string): Toolchain[] {
  const lines = input.split('\n').filter((line) => line.trim() !== '');
  const toolchainsMap = new Map<string, Toolchain>();

  let currentTool: string | null = null;

  for (const line of lines) {
    if (!line) continue;

    if (!line.startsWith(' ')) {
      currentTool = line.trim();
      if (toolchainsMap.has(currentTool)) throw new Error('Unexpected duplicate tool');
      toolchainsMap.set(currentTool, { name: currentTool, versions: [] });
    } else if (line.startsWith(' ')) {
      if (!currentTool) throw new Error('Unexpected line with no current tool');
      if (!toolchainsMap.has(currentTool)) throw new Error('Unexpected line with no current tool');
      if (line.startsWith(' *'))
        toolchainsMap.get(currentTool)!.versions.push({ version: line.replace('*', '').trim(), inUse: true });
      else toolchainsMap.get(currentTool)!.versions.push({ version: line.trim(), inUse: false });
    }
  }

  return Array.from(toolchainsMap.values());
}

export const api = {
  asdf: {
    list: {
      queryKey: ['list'],
      queryFn: async () => {
        const command = new Command('asdf', ['list']);
        const { stdout } = await command.execute();
        return parseToolchains(stdout);
      },
    } satisfies UseQueryOptions<Toolchain[]>,
  },
};
