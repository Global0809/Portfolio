import { assetPath } from './site-path';

export type FullMusicVideo = {
  id: string;
  title: string;
  duration: number;
  cover: string;
  sources: { hd: string; mobile: string };
};

// Optimized web copies; original masters remain untouched.
export const fullMusicVideos: FullMusicVideo[] = [
  {
    id: 'i-do-da-biness',
    title: 'I Do Da Biness',
    duration: 122.81,
    cover: assetPath('media/full-music-videos/i-do-da-biness.webp'),
    sources: {
      hd: assetPath('media/full-music-videos/i-do-da-biness-1080.mp4'),
      mobile: assetPath('media/full-music-videos/i-do-da-biness-720.mp4'),
    },
  },
  {
    id: 'leo-ghetto',
    title: 'Leo Ghetto',
    duration: 184.041,
    cover: assetPath('media/full-music-videos/leo-ghetto.webp'),
    sources: {
      hd: assetPath('media/full-music-videos/leo-ghetto-1080.mp4'),
      mobile: assetPath('media/full-music-videos/leo-ghetto-720.mp4'),
    },
  },
  {
    id: 'nice-and-neat',
    title: 'Nice and Neat',
    duration: 212.857,
    cover: assetPath('media/full-music-videos/nice-and-neat.webp'),
    sources: {
      hd: assetPath('media/full-music-videos/nice-and-neat-1080.mp4'),
      mobile: assetPath('media/full-music-videos/nice-and-neat-720.mp4'),
    },
  },
  {
    id: 'owo',
    title: 'OWO',
    duration: 185.272,
    cover: assetPath('media/full-music-videos/owo.webp'),
    sources: {
      hd: assetPath('media/full-music-videos/owo-1080.mp4'),
      mobile: assetPath('media/full-music-videos/owo-720.mp4'),
    },
  },
];
