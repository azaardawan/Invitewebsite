import type { SignatureStrokes } from '@/lib/signature-strokes';

/**
 * Sample guest messages for the board's preview in Admin (never a customer's): a mix of short and long messages in
 * Arabic, Kurdish and English, each with a made-up signature, so the owner sees a full board on their artwork.
 */
export const SAMPLE_MESSAGES: readonly [string, string][] = [
  ['سارا أحمد', 'ألف مبروك! الله يتمم عليكم بالخير وتكون حياتكم كلها فرح ومحبة.'],
  ['Lana & Rebin', 'Congratulations! Wishing you a lifetime of love and laughter.'],
  ['ئاراس', 'پیرۆزە! بە خۆشی و ئاسوودەیی پێکەوە بژین.'],
  ['أم محمد', 'مبروك يا أحلى عروسين، ربي يسعدكم ويرزقكم الذرية الصالحة ويجعل بيتكم عامر بالحب والضحك، والله فرحنا لكم من كل قلبنا ونتمنى نشوفكم دائماً بهالفرحة.'],
  ['Dilan', 'So happy for you both ♥'],
  ['خالد وعائلته', 'بالرفاه والبنين'],
  ['هێڤی', 'هیوای ژیانێکی پڕ لە خۆشەویستیتان بۆ دەخوازم.'],
  ['زينب', 'مبارك عليكم، يا رب دايماً مع بعض بالحلوة والمرة.'],
  ['The Karims', 'From the moment we met you both we knew this day would come. Thank you for letting us share it. May every year bring you closer, kinder and happier than the one before. With all our love, always.'],
  ['ريم', 'ألف ألف مبروك ❤'],
  ['شیلان', 'پیرۆزبێت ئازیزانم'],
  ['عمر', 'الله يوفقكم ويسعدكم'],
  ['Sozan', 'Best wishes from all of us in Erbil!'],
  ['نور الهدى', 'مبروك، عقبال الفرحة الكبيرة بالبيت الجديد.'],
  ['ئەڤین', 'بە هیوای ژیانێکی خۆش'],
  ['جدّو حسن', 'يا أولادي، المحبة صبر واحترام. كونوا سند لبعض في كل يوم، والله يحفظكم ويبارك فيكم.'],
  ['Mira', 'Cheers to forever!'],
  ['فاطمة', 'مبروك حبيبتي، تستاهلين كل خير'],
  ['ڕێبین', 'پیرۆزبایی گەرم'],
  ['علي وسارة', 'نتمنى لكم حياة سعيدة'],
  ['Hana', 'Love you so much. Have the best day!'],
  ['ليلى', 'الله يجعلها فرحة العمر'],
  ['کاوە', 'هەزار جار پیرۆزە'],
  ['مريم', 'مبروك، ربي يتمم بخير'],
  ['Shirin', 'Here is to love, laughter and happily ever after.'],
  ['حيدر', 'بالتوفيق دائماً'],
  ['ژینۆ', 'خۆشەویستیتان هەمیشەیی بێت'],
  ['أحمد', 'ألف مبروك يا غالي'],
  ['Nawroz', 'Congrats!'],
  ['سلمى', 'مبروك وعقبال كل الأفراح'],
  ['Aya', 'So much love from London'],
  ['أبو علي', 'الله يبارك لكم ويبارك عليكم ويجمع بينكم في خير'],
];

/** A believable made-up signature: one looping stroke and a tail, the same for the same seed. */
export function sampleSignature(seed: number): SignatureStrokes {
  const pts: number[] = [];
  const loops = 3 + (seed % 3);
  const phase = (seed * 1.7) % Math.PI;
  const steps = loops * 14;
  for (let k = 0; k <= steps; k++) {
    const a = (k / 14) * Math.PI * 2;
    // A trochoid: the pen moves along while circling, like joined-up letters.
    const x = 12 + k * 2.6 + 10 * Math.cos(a + phase);
    const y = 46 - 18 * Math.sin(a + phase) * (0.75 + 0.25 * Math.sin(k / 5 + seed));
    pts.push(Math.round(x * 10) / 10, Math.round(y * 10) / 10, k * 15);
  }
  const lastX = pts[pts.length - 3]!;
  pts.push(Math.round((lastX + 40) * 10) / 10, 30, steps * 15 + 80);
  return { w: Math.ceil(lastX + 50), h: 90, s: [pts] };
}
