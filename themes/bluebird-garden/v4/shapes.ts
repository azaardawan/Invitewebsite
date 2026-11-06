/** The poster shapes (manifest `print.shapes`, feature `card_arch`): an arch like the announcement's, an oval, a wavy frame, rounded corners. */
export const SHAPES = {
  arch: {
    label: { ar: 'قوس', en: 'Arch', ckb: 'کەوانە', bdn: 'کەڤان' },
    widthMm: 175.2,
    heightMm: 271.2,
    outline: 'M0 87.6 C0 39.2 39.2 0 87.6 0 C136 0 175.2 39.2 175.2 87.6 L175.2 265.2 Q175.2 271.2 169.2 271.2 L6 271.2 Q0 271.2 0 265.2 Z',
  },
  'arch-oval': {
    label: { ar: 'بيضاوي', en: 'Oval', ckb: 'هێلکەیی', bdn: 'هێلکەیی' },
    widthMm: 181.2,
    heightMm: 280.8,
    outline: 'M90.6 0 C145.2 0 181.2 62.4 181.2 140.4 C181.2 218.4 145.2 280.8 90.6 280.8 C36 280.8 0 218.4 0 140.4 C0 62.4 36 0 90.6 0 Z',
  },
  'arch-wavy': {
    label: { ar: 'إطار متموّج', en: 'Wavy frame', ckb: 'چوارچێوەی شەپۆلاوی', bdn: 'چوارچۆڤێ شەپۆلی' },
    widthMm: 174.0,
    heightMm: 272.4,
    outline:
      'M33 0 Q87 13.2 141 0 Q144.6 14.4 165.6 19.2 Q156 64.2 165.6 100.2 Q174 136.2 165.6 172.2 Q156 208.2 165.6 253.2 Q144.6 258 141 272.4 Q87 259.2 33 272.4 Q29.4 258 8.4 253.2 Q18 208.2 8.4 172.2 Q0 136.2 8.4 100.2 Q18 64.2 8.4 19.2 Q29.4 14.4 33 0 Z',
  },
  'arch-corners': {
    label: { ar: 'إطار بزوايا مقوّسة', en: 'Rounded corners', ckb: 'چوارچێوەی گۆشە خڕ', bdn: 'چوارچۆڤێ گۆشە خڕ' },
    widthMm: 175.2,
    heightMm: 271.2,
    outline: 'M22.2 0 L153 0 Q155.1 20.7 175.2 22.8 L175.2 248.4 Q155.1 250.5 153 271.2 L22.2 271.2 Q20.1 250.5 0 248.4 L0 22.8 Q20.1 20.7 22.2 0 Z',
  },
} as const;
export type ShapeKey = keyof typeof SHAPES;
