// Public files need the project prefix on GitHub Pages, including runtime fetches.
export const assetPath = (path: string) => `/Portfolio/${path.replace(/^\/+/, '')}`;
