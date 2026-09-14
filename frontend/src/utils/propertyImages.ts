// Curated high-resolution architectural photography for listings
// Categorized by property type and index-stable hash

export interface PropertyGallery {
  cover: string;
  exterior: string;
  living: string;
  bedroom: string;
  kitchen: string;
  balcony: string;
}

const APARTMENT_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
];

const VILLA_IMAGES = [
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
];

const LIVING_IMAGES = [
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
];

const BEDROOM_IMAGES = [
  'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
];

const KITCHEN_IMAGES = [
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=1200&q=80',
];

const BALCONY_IMAGES = [
  'https://images.unsplash.com/photo-1533779283484-84e14e8c4a45?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=80',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getPropertyImages(id: string, propertyType: string = 'apartment'): PropertyGallery {
  const hash = hashString(id || 'default');
  const typeLower = (propertyType || '').toLowerCase();
  
  const pool = typeLower.includes('villa') || typeLower.includes('independent')
    ? VILLA_IMAGES
    : APARTMENT_IMAGES;

  const cover = pool[hash % pool.length];
  const exterior = pool[(hash + 1) % pool.length];
  const living = LIVING_IMAGES[hash % LIVING_IMAGES.length];
  const bedroom = BEDROOM_IMAGES[hash % BEDROOM_IMAGES.length];
  const kitchen = KITCHEN_IMAGES[hash % KITCHEN_IMAGES.length];
  const balcony = BALCONY_IMAGES[hash % BALCONY_IMAGES.length];

  return { cover, exterior, living, bedroom, kitchen, balcony };
}
