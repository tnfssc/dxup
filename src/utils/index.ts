import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function friendlyPath(path: string[]): string {
  return `${path.join('/').startsWith('~') ? '' : '/'}${path.join('/')}`;
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export * from './cmd';
