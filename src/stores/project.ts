import { atom } from 'nanostores';

/**
 * The current project's directory.
 */
export const $project = atom<string>('');
