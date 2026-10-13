import 'server-only';
import { and, asc, eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { packages, themes, type I18nContent } from '@/server/db/schema';
import { createPackage } from './packages';
import { updateThemeSettings } from './themes';
import type { Actor } from './common';
import type { FeatureKey } from '@/catalog/features';
import type { FieldKey } from '@/catalog/fields';

/**
 * Display texts and packages the owner asked for in chat, applied once on deploy (seed). Each step runs only
 * while the owner has not touched that part in Admin: the name and description only while the design still
 * has its working title, the packages only while the design has none. Changes go through the catalog
 * services, so they are validated and audited like an Admin edit.
 */
type OwnerSetup = {
  themeKey: string;
  /** The manifest's working title (Arabic); the name is set only while the design still carries it. */
  workingTitleAr: string;
  name: I18nContent;
  description: I18nContent;
  /** Packages in order; each takes the price of the package at the same position in `pricesFrom`. */
  packages: { name: I18nContent; description: I18nContent; featureKeys: FeatureKey[] }[];
  pricesFrom: string;
};

const FIELDS: FieldKey[] = ['baby_name', 'father_name', 'birth_date'];

/** The two newborn packages the owner sells for every girl design (owner, 2026-10-13). */
const GIRL_PACKAGES: OwnerSetup['packages'] = [
  {
    name: { ar: 'الباقة الأساسية', en: 'Basic', ckb: 'پاکێجی سەرەکی', bdn: 'پاکێجا سەرەکی' },
    description: {
      ar: 'بطاقة مولودة جاهزة للطباعة بوجهين (أمامي وخلفي) مع صورة ستوري لإنستغرام، باسم مولودتكم وتاريخ ولادتها.',
      en: "A printable card (front and back) and an Instagram story picture, with your baby girl's name and date of birth.",
      ckb: 'کارتێکی ئامادەی چاپ (پێش و پشت) و وێنەیەکی ستۆری ئینستاگرام، بە ناو و بەرواری لەدایکبوونی کچەکەتان.',
      bdn: 'کارتەکا ئامادەی چاپێ (پێش و پشت) و وێنەیێ ستۆری یێ ئینستاگرامێ، ب ناڤ و دیرۆکا ژدایکبوونا کچا هەوە.',
    },
    featureKeys: ['print_card', 'story'],
  },
  {
    name: { ar: 'الباقة الكاملة', en: 'Complete', ckb: 'پاکێجی تەواو', bdn: 'پاکێجا تەمام' },
    description: {
      ar: 'كل ما في التصميم: بطاقة مطبوعة بوجهين، صورة ستوري لإنستغرام، ملصقات الشوكولاتة (دائرية أو مربعة أو الاثنان)، وملصق قنينة الماء، جميعها باسم مولودتكم.',
      en: "Everything in the design: the printable card (front and back), the Instagram story, chocolate stickers (round, square or both) and a water-bottle label, all with your baby girl's name.",
      ckb: 'هەموو بەشەکانی دیزاینەکە: کارتی چاپ (پێش و پشت)، ستۆری ئینستاگرام، لکێنەری چوکلێت (بازنەیی، چوارگۆشە یان هەردووکیان) و لکێنەری بوتڵی ئاو، هەمووی بە ناوی کچەکەتان.',
      bdn: 'هەمی پارچێن دیزاینێ: کارتا چاپێ (پێش و پشت)، ستۆری یا ئینستاگرامێ، لکێنەرێن چوکلێتێ (خڕ، چارگوشە یان هەردوو) و لکێنەرا بوتلا ئاڤێ، هەمی ب ناڤێ کچا هەوە.',
    },
    featureKeys: ['print_card', 'story', 'sticker', 'bottle_label'],
  },
];

export const OWNER_SETUPS: OwnerSetup[] = [
  {
    themeKey: 'pearl-garden',
    workingTitleAr: 'حديقة اللؤلؤ — مولودة',
    name: { ar: 'أوراق مزهرة', en: 'Flowery Leaves', ckb: 'گەڵای گوڵدار', bdn: 'بەلگێن گولدار' },
    description: {
      ar: 'تصميم مطرّز رقيق بزهور وردية ولآلئ وأغصان خضراء وحمامات بيضاء على قماش الكتان، واسم ابنتكم مطرّز بخيوط وردية.',
      en: "A delicate embroidered design with pink flowers, pearls, green leafy branches and white doves on linen, with your daughter's name stitched in pink thread.",
      ckb: 'دیزاینێکی چنراوی ناسک بە گوڵی پەمەیی و مرواری و لقی سەوز و کۆتری سپی لەسەر قوماشی کەتان، و ناوی کچەکەتان بە دەزوی پەمەیی چنراوە.',
      bdn: 'دیزاینەکێ چنراوێ ناسک ب گولێن پەمبەیی و مرواری و چقێن کەسک و کۆترێن سپی ل سەر قوماشێ کەتانێ، و ناڤێ کچا هەوە ب دەزیێ پەمبەیی چنراوە.',
    },
    packages: GIRL_PACKAGES,
    pricesFrom: 'rosebird-garden',
  },
];

/** Applies the owner's chat requests that Admin hasn't overtaken yet. Returns what it did, for the deploy log. */
export async function applyOwnerSetups(db: DbOrTx, actor: Actor, setups = OWNER_SETUPS): Promise<string[]> {
  const done: string[] = [];
  for (const s of setups) {
    const [theme] = await db.select().from(themes).where(eq(themes.key, s.themeKey));
    if (!theme) continue;
    if (theme.name.ar === s.workingTitleAr) {
      await updateThemeSettings(
        db,
        theme.id,
        { name: s.name, description: s.description, sectionId: theme.sectionId, coverAssetId: theme.coverAssetId, musicTrackId: theme.musicTrackId },
        actor,
      );
      done.push(`${s.themeKey}: name and description`);
    }
    const [anyPackage] = await db.select({ id: packages.id }).from(packages).where(eq(packages.themeId, theme.id)).limit(1);
    if (anyPackage) continue;
    const [source] = await db.select({ id: themes.id }).from(themes).where(eq(themes.key, s.pricesFrom));
    const prices = source
      ? (await db
          .select({ priceIqd: packages.priceIqd })
          .from(packages)
          .where(and(eq(packages.themeId, source.id), eq(packages.status, 'ACTIVE')))
          .orderBy(asc(packages.sortOrder))).map((p) => p.priceIqd)
      : [];
    // Without the sister design's prices there is nothing safe to charge: leave the packages to Admin.
    if (prices.length < s.packages.length) continue;
    for (const [i, p] of s.packages.entries()) {
      await createPackage(db, theme.id, { name: p.name, description: p.description, priceIqd: prices[i]!, fieldKeys: FIELDS, featureKeys: p.featureKeys }, actor);
    }
    done.push(`${s.themeKey}: ${s.packages.length} packages (prices from ${s.pricesFrom})`);
  }
  return done;
}
