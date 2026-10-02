export const site = {
  name: 'Haturi Studio',
  line: 'Handmade in Dhaka',
  city: 'Dhaka',
  instagram: 'haturistudio',
  messenger: 'haturistudio',
} as const;

export const igDm = (handle: string = site.instagram) => `https://ig.me/m/${handle}`;
export const fbDm = (page: string = site.messenger) => `https://m.me/${page}`;
export const igProfile = (handle: string = site.instagram) => `https://www.instagram.com/${handle}/`;
