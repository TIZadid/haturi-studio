export const site = {
  name: 'Haturi Studio',
  line: 'Handmade in Dhaka',
  city: 'Dhaka',
  instagram: 'haturistudio',
} as const;

export const igDm = (handle: string = site.instagram) => `https://ig.me/m/${handle}`;
export const igProfile = (handle: string = site.instagram) => `https://www.instagram.com/${handle}/`;
