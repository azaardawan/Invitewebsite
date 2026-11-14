import 'server-only';
import { and, asc, eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { packages, themePalettes, themes, type I18nContent } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { auditActor } from './common';
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
  /** Packages in order; each takes the price of the package at the same position in `pricesFrom`. None: left to Admin. */
  packages: { name: I18nContent; description: I18nContent; featureKeys: FeatureKey[] }[];
  pricesFrom?: string;
  /** Colour sets the customer may pick from (packages with colour choice), added while the design has none. */
  palettes?: { name: I18nContent; colors: Record<string, string> }[];
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
  {
    // Memory Museum (owner, 2026-11-13): the description in four languages. The packages (2, 4 and 6 rooms) are made in
    // Admin with the owner's prices; their texts are in docs/themes/memory-museum/PACKAGES.md.
    themeKey: 'memory-museum',
    workingTitleAr: 'متحف الذكريات',
    name: { ar: 'متحف الذكريات', en: 'Memory Museum', ckb: 'مۆزەخانەی یادەوەری', bdn: 'مۆزەخانەیا بیرهاتنان' },
    description: {
      ar: 'متحف ثلاثي الأبعاد لذكرياتكما: يتجوّل ضيوفكم بين قاعاته من هاتفهم أو حاسوبهم، ويرون صوركم معلّقة على الجدران كلوحات فنية، لكل صورة عنوانها ووصفها ولكل قاعة اسمها، ويُعرض الفيديو على شاشة المدخل.',
      en: 'A 3D museum of your memories: your guests walk through its rooms on their phone or computer and see your photos hanging on the walls like paintings, each with its own title and words, each room with its own name, and your video on the screen at the entrance.',
      ckb: 'مۆزەخانەیەکی سێ ڕەهەندی بۆ یادەوەرییەکانتان: میوانەکانتان لە مۆبایل یان کۆمپیوتەرەکەیانەوە بە هۆڵەکانیدا دەگەڕێن و وێنەکانتان وەک تابلۆ لەسەر دیوارەکان دەبینن، هەر وێنەیەک بە ناونیشان و وەسفی خۆی و هەر هۆڵێک بە ناوی خۆی، و ڤیدیۆکەتان لەسەر شاشەی دەروازە.',
      bdn: 'مۆزەخانەکا سێ ڕەهەندی بۆ بیرهاتنێن هەوە: میڤانێن هەوە ژ مۆبایل یان کۆمپیوتەرا خۆ د هۆلێن ویدا دگەڕن و وێنێن هەوە وەکی تابلۆیان ل سەر دیواران دبینن، هەر وێنەک ب ناڤونیشان و وەسفا خۆ و هەر هۆلەک ب ناڤێ خۆ، و ڤیدیۆیا هەوە ل سەر شاشا دەرگەهی.',
    },
    packages: [],
    // The walls' colours the owner offers instead of the warm cream (2026-11-14), for packages with colour choice
    // (the design's slot `walls`, from v2).
    palettes: [
      { name: { ar: 'عنابي داكن', en: 'Deep Burgundy', ckb: 'شەرابیی تۆخ', bdn: 'شەرابیێ تاری' }, colors: { walls: '#6e2a35' } },
      { name: { ar: 'أخضر مريمية هادئ', en: 'Muted Sage Green', ckb: 'سەوزی کاڵی مێرامی', bdn: 'کەسکێ کاڵێ مێرامی' }, colors: { walls: '#9aab8f' } },
      { name: { ar: 'أزرق مغبر', en: 'Dusty Blue', ckb: 'شینی تۆزاوی', bdn: 'شینێ تۆزاوی' }, colors: { walls: '#8ea3b5' } },
      { name: { ar: 'وردي ناعم', en: 'Soft Rose', ckb: 'پەمەیی نەرم', bdn: 'پەمبەیی نەرم' }, colors: { walls: '#d9b0aa' } },
      { name: { ar: 'رمادي بني دافئ', en: 'Warm Taupe', ckb: 'قاوەیی خۆڵەمێشیی گەرم', bdn: 'قاوەیی خۆلەمێشیێ گەرم' }, colors: { walls: '#a8977f' } },
    ],
  },
];

/** Applies the owner's chat requests that Admin hasn't overtaken yet. Returns what it did, for the deploy log. */
export async function applyOwnerSetups(db: DbOrTx, actor: Actor, setups = OWNER_SETUPS): Promise<string[]> {
  const done: string[] = [];
  for (const s of setups) {
    const [theme] = await db.select().from(themes).where(eq(themes.key, s.themeKey));
    if (!theme) continue;
    // Only while the owner hasn't changed them: the working title still there, and (when the name stays the working
    // title) no description written yet.
    if (theme.name.ar === s.workingTitleAr && (s.name.ar !== s.workingTitleAr || !theme.description?.ar?.trim())) {
      await updateThemeSettings(
        db,
        theme.id,
        { name: s.name, description: s.description, sectionId: theme.sectionId, coverAssetId: theme.coverAssetId, musicTrackId: theme.musicTrackId },
        actor,
      );
      done.push(`${s.themeKey}: name and description`);
    }
    if (s.palettes?.length) {
      const [anyPalette] = await db.select({ id: themePalettes.id }).from(themePalettes).where(eq(themePalettes.themeId, theme.id)).limit(1);
      if (!anyPalette) {
        for (const [i, p] of s.palettes.entries()) {
          await db.insert(themePalettes).values({ themeId: theme.id, name: p.name, colors: p.colors, sortOrder: i });
          await recordAudit(db, { ...auditActor(actor), action: 'palette.create', objectType: 'theme', objectId: theme.id, after: { name: p.name, colors: p.colors } });
        }
        done.push(`${s.themeKey}: ${s.palettes.length} colour sets`);
      }
    }
    if (!s.packages.length || !s.pricesFrom) continue;
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
