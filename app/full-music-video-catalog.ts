import { assetPath } from './site-path';

export type FullMusicVideo = {
  id: string;
  title: string;
  duration: number;
  cover: string;
  playbackId: string;
};

// Public Mux playback IDs only. Keep account credentials out of this catalog.
// Unconfigured videos are available on localhost, never as broken public links.
export const fullMusicVideos: FullMusicVideo[] = [
  {
    id: 'i-do-da-biness',
    title: 'I Do Da Biness',
    duration: 122.81,
    cover: assetPath('media/full-music-videos/i-do-da-biness.webp'),
    playbackId: '',
  },
  {
    id: 'leo-ghetto',
    title: 'Leo Ghetto',
    duration: 184.041,
    cover: assetPath('media/full-music-videos/leo-ghetto.webp'),
    playbackId: '',
  },
  {
    id: 'nice-and-neat',
    title: 'Nice and Neat',
    duration: 212.857,
    cover: assetPath('media/full-music-videos/nice-and-neat.webp'),
    playbackId: '',
  },
  {
    id: 'owo',
    title: 'OWO',
    duration: 185.272,
    cover: assetPath('media/full-music-videos/owo.webp'),
    playbackId: '',
  },
];
