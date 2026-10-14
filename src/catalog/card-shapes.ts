/**
 * Printable card shapes. A design lists the shapes it offers in its manifest (`print.card.shapes`, default
 * just `print.card.size`), and the owner picks per package which of them the customer gets. Rectangles print as
 * they are; a cut-out shape (with an `outline`) is printed on its bounding rectangle: the customer's file shows
 * the card cut to its shape, the print-shop file keeps the bleed and adds a thin cutting line.
 *
 * To add a shape: trace its outline as one closed path in a 0–1 box (x across the width, y down the height;
 * only absolute M / C / L / Z commands) and give it its printed size in mm. Its name goes in the messages
 * (`store.cardShapes.<key>`, Kurdish via docs/translations/KURDISH_REVIEW.md).
 */
export type CardShapeSpec = {
  widthMm: number;
  heightMm: number;
  /** Closed outline in a 0–1 box, or null for a plain rectangle. */
  outline: string | null;
  /** The back is the front turned sideways (A5 → 210 × 148 mm); otherwise the same size, outline mirrored. */
  landscapeBack: boolean;
  /**
   * Where text fits well inside a cut-out shape, as fractions of its width and height kept clear from each
   * edge: [top, right, bottom, left] (the back mirrors left and right). Rectangles: none.
   */
  safe?: readonly [number, number, number, number];
};

export const CARD_SHAPES = {
  A5: { widthMm: 148, heightMm: 210, outline: null, landscapeBack: true },
  '5x7': { widthMm: 127, heightMm: 178, outline: null, landscapeBack: true },
  // Traced from the owner's "23. Leaf" picture; 12.6 × 20 cm keeps its proportions.
  leaf: {
    widthMm: 126,
    heightMm: 200,
    outline:
      'M0.6169 0 C0.6201 0.0056 0.6292 0.0225 0.6361 0.0338 C0.643 0.045 0.6508 0.0563 0.6585 0.0675 C0.6663 0.0788 0.6736 0.09 0.6828 0.1013 C0.6919 0.1125 0.7021 0.1238 0.7134 0.135 C0.7246 0.1463 0.7374 0.1575 0.7503 0.1688 C0.7632 0.18 0.7772 0.1913 0.7909 0.2025 C0.8047 0.2138 0.8196 0.225 0.8329 0.2363 C0.8462 0.2475 0.8591 0.2588 0.8708 0.27 C0.8825 0.2813 0.893 0.2925 0.903 0.3038 C0.913 0.315 0.9222 0.3263 0.9308 0.3376 C0.9394 0.3488 0.9475 0.3601 0.9546 0.3713 C0.9617 0.3826 0.9679 0.3938 0.9734 0.4051 C0.9789 0.4163 0.9837 0.4276 0.9876 0.4388 C0.9916 0.4501 0.9949 0.4613 0.9969 0.4726 C0.9989 0.4838 0.9994 0.4951 0.9998 0.5063 C1.0002 0.5176 0.9999 0.5288 0.9995 0.5401 C0.9991 0.5513 0.9989 0.5626 0.9974 0.5738 C0.996 0.5851 0.994 0.5963 0.991 0.6076 C0.988 0.6188 0.9841 0.6301 0.9794 0.6414 C0.9748 0.6526 0.9694 0.6639 0.9631 0.6751 C0.9568 0.6864 0.9499 0.6976 0.9418 0.7089 C0.9338 0.7201 0.9249 0.7314 0.9148 0.7426 C0.9047 0.7539 0.8938 0.7651 0.8812 0.7764 C0.8685 0.7876 0.8545 0.7989 0.8387 0.8101 C0.8229 0.8214 0.8059 0.8326 0.7862 0.8439 C0.7665 0.8551 0.7436 0.8664 0.7204 0.8776 C0.6971 0.8889 0.6695 0.9001 0.6468 0.9114 C0.6241 0.9226 0.602 0.9339 0.584 0.9451 C0.5661 0.9564 0.5501 0.9698 0.5389 0.9789 C0.5277 0.988 0.5206 0.9965 0.5169 1 C0.5083 0.9965 0.4869 0.988 0.465 0.9789 C0.4431 0.9698 0.4118 0.9564 0.3857 0.9451 C0.3595 0.9339 0.3324 0.9226 0.308 0.9114 C0.2836 0.9001 0.26 0.8889 0.2392 0.8776 C0.2184 0.8664 0.2 0.8551 0.1833 0.8439 C0.1666 0.8326 0.1525 0.8214 0.1391 0.8101 C0.1256 0.7989 0.1137 0.7876 0.1028 0.7764 C0.0919 0.7651 0.0823 0.7539 0.0735 0.7426 C0.0646 0.7314 0.0569 0.7201 0.0498 0.7089 C0.0427 0.6976 0.0365 0.6864 0.031 0.6751 C0.0255 0.6639 0.0206 0.6526 0.0166 0.6414 C0.0125 0.6301 0.0093 0.6188 0.0066 0.6076 C0.004 0.5963 0.0019 0.5851 0.0008 0.5738 C-0.0003 0.5626 -0.0002 0.5513 0 0.5401 C0.0002 0.5288 0.0006 0.5176 0.0021 0.5063 C0.0036 0.4951 0.006 0.4838 0.0089 0.4726 C0.0118 0.4613 0.0151 0.4501 0.0194 0.4388 C0.0236 0.4276 0.0286 0.4163 0.0343 0.4051 C0.0399 0.3938 0.0463 0.3826 0.0534 0.3713 C0.0605 0.3601 0.0684 0.3488 0.077 0.3376 C0.0856 0.3263 0.095 0.315 0.105 0.3038 C0.1151 0.2925 0.1255 0.2813 0.1371 0.27 C0.1488 0.2588 0.1611 0.2475 0.1751 0.2363 C0.189 0.225 0.204 0.2138 0.2209 0.2025 C0.2378 0.1913 0.2558 0.18 0.2763 0.1688 C0.2969 0.1575 0.3192 0.1463 0.3442 0.135 C0.3691 0.1238 0.3986 0.1125 0.4261 0.1013 C0.4535 0.09 0.4845 0.0788 0.5089 0.0675 C0.5333 0.0563 0.5544 0.045 0.5724 0.0338 C0.5904 0.0225 0.6095 0.0056 0.6169 0Z',
    landscapeBack: false,
    safe: [0.2, 0.16, 0.18, 0.16],
  },
  // Drawn from the owner's "1. Heart" picture (wide heart, lobes and a sharp point).
  heart: {
    widthMm: 160,
    heightMm: 152,
    outline:
      'M0.5 0.2 C0.55 0.07 0.64 0 0.76 0 C0.91 0 1 0.12 1 0.29 C1 0.56 0.8 0.76 0.5 1 C0.2 0.76 0 0.56 0 0.29 C0 0.12 0.09 0 0.24 0 C0.36 0 0.45 0.07 0.5 0.2Z',
    landscapeBack: false,
    safe: [0.24, 0.2, 0.36, 0.2],
  },
  // From the owner's "5. Oval" picture.
  oval: {
    widthMm: 135,
    heightMm: 180,
    outline:
      'M0.5 0 C0.7761 0 1 0.2239 1 0.5 C1 0.7761 0.7761 1 0.5 1 C0.2239 1 0 0.7761 0 0.5 C0 0.2239 0.2239 0 0.5 0Z',
    landscapeBack: false,
    safe: [0.16, 0.16, 0.16, 0.16],
  },
  // From the owner's "15. Ogee Arch" picture: pointed top and bottom, shoulders and a wide middle.
  'ogee-arch': {
    widthMm: 130,
    heightMm: 198,
    outline:
      'M0.5 0 C0.5323 0.07 0.6075 0.12 0.715 0.135 C0.8225 0.13 0.9085 0.17 0.8763 0.245 C1.0375 0.3 1.0375 0.68 0.8978 0.73 C0.93 0.8 0.8655 0.86 0.758 0.865 C0.6505 0.875 0.5323 0.93 0.5 1 C0.4677 0.93 0.3495 0.875 0.242 0.865 C0.1345 0.86 0.07 0.8 0.1022 0.73 C-0.0375 0.68 -0.0375 0.3 0.1237 0.245 C0.0915 0.17 0.1775 0.13 0.285 0.135 C0.3925 0.12 0.4677 0.07 0.5 0Z',
    landscapeBack: false,
    safe: [0.2, 0.12, 0.18, 0.12],
  },
  // From the owner's "21. Butterfly" picture: two upper and two lower wings.
  butterfly: {
    widthMm: 180,
    heightMm: 160,
    outline:
      'M0.5 0.3632 C0.6 0.2018 0.8 0 0.92 0 C0.98 0 1 0.0404 1 0.111 C1 0.2825 0.98 0.4035 0.86 0.5044 C0.97 0.575 0.99 0.7365 0.93 0.8575 C0.88 0.9584 0.83 1.0088 0.76 0.9987 C0.66 0.9887 0.55 0.9281 0.5 0.8272 C0.45 0.9281 0.34 0.9887 0.24 0.9987 C0.17 1.0088 0.12 0.9584 0.07 0.8575 C0.01 0.7365 0.03 0.575 0.14 0.5044 C0.02 0.4035 0 0.2825 0 0.111 C0 0.0404 0.02 0 0.08 0 C0.2 0 0.4 0.2018 0.5 0.3632Z',
    landscapeBack: false,
    safe: [0.42, 0.24, 0.2, 0.24],
  },
  // From the owner's "22. Cloud" picture: rounded bumps, two along the bottom.
  cloud: {
    widthMm: 200,
    heightMm: 145,
    outline:
      'M0.0583 0.438 C-0.0254 0.2175 0.142 0.0742 0.2571 0.2065 C0.299 -0.0471 0.6024 -0.0692 0.6756 0.1513 C0.7907 0.0411 0.9686 0.1513 0.9372 0.3939 C1.0209 0.4601 1.0209 0.7467 0.9372 0.8129 C0.8954 1.0334 0.6652 1.0334 0.5606 0.9232 C0.4559 1.0334 0.163 1.0334 0.1002 0.868 C-0.0254 0.8129 -0.0254 0.5372 0.0583 0.438Z',
    landscapeBack: false,
    safe: [0.3, 0.12, 0.16, 0.12],
  },
} as const satisfies Record<string, CardShapeSpec>;

export type CardShape = keyof typeof CARD_SHAPES;
export const CARD_SHAPE_KEYS = Object.keys(CARD_SHAPES) as CardShape[];

export function isCardShape(v: unknown): v is CardShape {
  return typeof v === 'string' && Object.hasOwn(CARD_SHAPES, v);
}

/**
 * A shape's outline scaled to a box (e.g. its size in mm), optionally mirrored left to right (the back of a
 * cut-out card is the front's mirror image) and moved by an offset (e.g. the bleed). Null for a rectangle.
 */
export function outlinePath(shape: CardShape, box: { width: number; height: number; mirror?: boolean; offsetX?: number; offsetY?: number }): string | null {
  const outline = CARD_SHAPES[shape].outline as string | null;
  if (!outline) return null;
  const { width, height, mirror = false, offsetX = 0, offsetY = 0 } = box;
  let i = 0;
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return outline.replace(/-?\d*\.?\d+/g, (m) => {
    const v = Number(m);
    const isX = i++ % 2 === 0;
    return String(round(isX ? (mirror ? 1 - v : v) * width + offsetX : v * height + offsetY));
  });
}

/** The safe area of a shape in mm from each trim edge ([top, right, bottom, left]), mirrored for a back. */
export function safeAreaMm(shape: CardShape, box: { width: number; height: number; mirror?: boolean }): { top: number; right: number; bottom: number; left: number } | null {
  const safe = (CARD_SHAPES[shape] as CardShapeSpec).safe;
  if (!safe) return null;
  const [t, r, b, l] = safe;
  const [right, left] = box.mirror ? [l, r] : [r, l];
  return { top: t * box.height, right: right * box.width, bottom: b * box.height, left: left * box.width };
}
