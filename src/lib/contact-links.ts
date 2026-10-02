/** Public contact links built from Admin → Website settings (pure helpers, safe anywhere). */
export type ContactInfo = {
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  address: { ar: string; en: string; ckb?: string | null; bdn?: string | null } | null;
  hours: { ar: string; en: string; ckb?: string | null; bdn?: string | null } | null;
};

export function socialLinks(c: Pick<ContactInfo, 'instagram' | 'facebook' | 'tiktok'>) {
  return [
    c.instagram ? { key: 'instagram' as const, href: `https://www.instagram.com/${c.instagram}`, handle: c.instagram } : null,
    c.facebook ? { key: 'facebook' as const, href: `https://www.facebook.com/${c.facebook}`, handle: c.facebook } : null,
    c.tiktok ? { key: 'tiktok' as const, href: `https://www.tiktok.com/@${c.tiktok}`, handle: c.tiktok } : null,
  ].filter((x) => x !== null);
}

export function whatsappHref(e164: string, text?: string) {
  return `https://wa.me/${e164.replace(/^\+/, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
