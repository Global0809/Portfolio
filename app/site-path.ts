// Custom-domain files are served at the site root, including runtime fetches.
export const assetPath = (path: string) => `/${path.replace(/^\/+/, '')}`;
