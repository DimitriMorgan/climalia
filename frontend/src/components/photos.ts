// Curated Unsplash photo IDs. Each ID is a verified `photo-XXX-YYY` fragment.
// Public CDN: https://images.unsplash.com/{id}?w=...&q=80&auto=format&fit=crop

export const HERO_PHOTO = 'photo-1776860153678-b204dccd0f65';

export const SERVICE_PHOTOS: Record<string, string> = {
  clim: 'photo-1726614846573-c1ac2e6161d1',
  'pac-air-eau': 'photo-1545649311-24d0ac00ae82',
  'pac-air-air': 'photo-1568634699096-82c9765548a0',
  vmc: 'photo-1770816306659-adcf99a11aeb',
  maintenance: 'photo-1748442001865-5583ec02ae22',
  pac: 'photo-1545649311-24d0ac00ae82',
  depan: 'photo-1676210133055-eab6ef033ce3',
};

export const PROJECT_PHOTOS: ReadonlyArray<string> = [
  'photo-1635006459494-c9b9665a666e',
  'photo-1486406146926-c627a92ad1ab',
  'photo-1535827841776-24afc1e255ac',
  'photo-1565363887715-8884629e09ee',
  'photo-1566226196556-ef949ce5f1a3',
  'photo-1605774337664-7a846e9cdf17',
  'photo-1513584684374-8bab748fbf90',
  'photo-1574958269340-fa927503f3dd',
  'photo-1670915198844-51975abf6955',
  'photo-1545324418-cc1a3fa10c00',
];

export const MODAL_BEFORE_PHOTO = 'photo-1547333101-6bb18e609b2f';
export const MODAL_AFTER_PHOTO = 'photo-1724582586458-a51791349977';

const FALLBACK_PROJECT_PHOTO = 'photo-1635006459494-c9b9665a666e';

export function projectPhotoFor(index: number): string {
  return PROJECT_PHOTOS[index % PROJECT_PHOTOS.length] ?? FALLBACK_PROJECT_PHOTO;
}
