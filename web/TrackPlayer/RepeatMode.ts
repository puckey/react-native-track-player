import type { RepeatMode as RepeatModeType } from '../../src/features';

export const RepeatMode = {
  Off: 'off' as const,
  Track: 'track' as const,
  Playlist: 'queue' as const,
} satisfies Record<string, RepeatModeType>;
