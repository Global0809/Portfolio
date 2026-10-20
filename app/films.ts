import { assetPath } from './site-path';
import portraitMedia from './portrait-media.json';

export const films = portraitMedia.map((film) => ({
  ...film,
  cover: assetPath(`/media/${film.cover}`),
  src: assetPath(`/media/${film.src}`),
}));
