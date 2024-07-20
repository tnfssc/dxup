export function friendlyPath(path: string[]): string {
  return `${path.join('/').startsWith('~') ? '' : '/'}${path.join('/')}`;
}
