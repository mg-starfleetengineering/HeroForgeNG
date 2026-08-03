export interface FantasyAvatarPreset {
  id: string;
  name: string;
  category: string;
  url: string;
}

// Curated SVG fantasy avatar presets embedded as clean data URIs
export const FANTASY_AVATAR_PRESETS: FantasyAvatarPreset[] = [
  {
    id: 'fighter_knight',
    name: 'Armored Knight',
    category: 'Martial',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%231e3a8a"/></linearGradient></defs><rect width="200" height="200" rx="40" fill="url(%23g1)"/><path d="M100 35 L140 65 L140 120 L100 165 L60 120 L60 65 Z" fill="%2394a3b8" stroke="%23f8fafc" stroke-width="4"/><circle cx="100" cy="85" r="18" fill="%23334155"/><rect x="80" y="105" width="40" height="6" rx="3" fill="%23f59e0b"/><polygon points="100,45 110,65 90,65" fill="%23ef4444"/></svg>'
  },
  {
    id: 'wizard_mage',
    name: 'Arcane Mage',
    category: 'Caster',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%237c3aed"/><stop offset="100%" stop-color="%23312e81"/></linearGradient></defs><rect width="200" height="200" rx="40" fill="url(%23g2)"/><path d="M100 25 L145 110 L55 110 Z" fill="%234c1d95" stroke="%23c084fc" stroke-width="3"/><path d="M65 110 L135 110 L145 155 L55 155 Z" fill="%23581c87"/><circle cx="100" cy="110" r="14" fill="%23fef08a"/><path d="M90 60 L110 60 L105 85 L95 85 Z" fill="%23f59e0b"/></svg>'
  },
  {
    id: 'rogue_shadow',
    name: 'Shadow Rogue',
    category: 'Stealth',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%23020617"/></linearGradient></defs><rect width="200" height="200" rx="40" fill="url(%23g3)"/><path d="M60 160 C60 110 70 80 100 80 C130 80 140 110 140 160 Z" fill="%23334155"/><ellipse cx="100" cy="75" rx="35" ry="40" fill="%230f172a" stroke="%2310b981" stroke-width="2"/><circle cx="85" cy="75" r="5" fill="%2310b981"/><circle cx="115" cy="75" r="5" fill="%2310b981"/></svg>'
  },
  {
    id: 'cleric_radiant',
    name: 'Radiant Cleric',
    category: 'Divine',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%2378350f"/></linearGradient></defs><rect width="200" height="200" rx="40" fill="url(%23g4)"/><circle cx="100" cy="100" r="55" fill="none" stroke="%23fef08a" stroke-width="6" stroke-dasharray="10 5"/><circle cx="100" cy="90" r="28" fill="%23fef3c7"/><path d="M90 120 L110 120 L115 170 L85 170 Z" fill="%23fef08a"/><polygon points="100,50 106,66 123,66 109,76 114,92 100,82 86,92 91,76 77,66 94,66" fill="%23ffffff"/></svg>'
  },
  {
    id: 'paladin_champion',
    name: 'Holy Champion',
    category: 'Divine',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230284c7"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="200" height="200" rx="40" fill="url(%23g5)"/><path d="M100 30 L150 70 L150 130 C150 155 100 175 100 175 C100 175 50 155 50 130 L50 70 Z" fill="%23e2e8f0" stroke="%2338bdf8" stroke-width="4"/><path d="M100 50 L100 150 M70 85 L130 85" stroke="%23f59e0b" stroke-width="8" stroke-linecap="round"/></svg>'
  },
  {
    id: 'ranger_hunter',
    name: 'Sylvan Hunter',
    category: 'Wild',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23166534"/><stop offset="100%" stop-color="%23064e3b"/></linearGradient></defs><rect width="200" height="200" rx="40" fill="url(%23g6)"/><path d="M50 160 C50 100 75 70 100 70 C125 70 150 100 150 160 Z" fill="%2315803d"/><circle cx="100" cy="80" r="24" fill="%23fde68a"/><path d="M80 65 Q100 45 120 65 L100 75 Z" fill="%23166534"/><path d="M135 40 L125 90 M145 45 L125 90" stroke="%23a16207" stroke-width="3"/></svg>'
  },
  {
    id: 'barbarian_berserker',
    name: 'Wild Berserker',
    category: 'Martial',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g7" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23991b1b"/><stop offset="100%" stop-color="%23450a0a"/></linearGradient></defs><rect width="200" height="200" rx="40" fill="url(%23g7)"/><circle cx="100" cy="95" r="32" fill="%23d97706"/><path d="M65 80 Q100 45 135 80 L140 120 L60 120 Z" fill="%2378350f"/><path d="M60 40 L75 75 M140 40 L125 75" stroke="%23f8fafc" stroke-width="6" stroke-linecap="round"/><path d="M85 90 L95 95 M115 90 L105 95" stroke="%23dc2626" stroke-width="3"/></svg>'
  },
  {
    id: 'bard_skald',
    name: 'Lore Bard',
    category: 'Arcane',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g8" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23db2777"/><stop offset="100%" stop-color="%23831843"/></linearGradient></defs><rect width="200" height="200" rx="40" fill="url(%23g8)"/><circle cx="100" cy="90" r="30" fill="%23fce7f3"/><path d="M60 65 L140 65 L130 50 L70 50 Z" fill="%23be185d"/><path d="M125 50 C140 30 160 35 150 55 Z" fill="%23f43f5e"/><circle cx="100" cy="140" r="22" fill="%23f59e0b" stroke="%2378350f" stroke-width="4"/></svg>'
  }
];

/**
 * Resizes and compresses an image file to a base64 Data URL (max 600x600px).
 * Prevents massive camera files from overflowing browser localStorage quotas.
 */
export async function compressAndConvertToBase64(file: File, maxDimension: number = 600, quality: number = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image element.'));
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP if supported, fallback to JPEG
        try {
          const dataUrl = canvas.toDataURL('image/webp', quality);
          if (dataUrl.startsWith('data:image/webp')) {
            resolve(dataUrl);
            return;
          }
        } catch {
          // ignore
        }

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
