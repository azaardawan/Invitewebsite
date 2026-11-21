import s from './opening.module.css';

/**
 * The velvet ring box, assembled in 3D from the flat face layers in
 * `assets/` (see docs/themes/olive-ring-box/brief.md §6 for coordinates).
 * The lid hinges at the back-top edge of the base. Purely decorative.
 */
export function RingBox() {
  return (
    <div className={s.stage} aria-hidden="true">
      <div className={s.halo} />
      <div className={s.shadow} />
      <div className={s.camera}>
        <div className={s.box}>
          <div className={`${s.face} ${s.baseFront}`} />
          <div className={`${s.face} ${s.baseLeft}`} />
          <div className={`${s.face} ${s.baseRight}`} />
          <div className={`${s.face} ${s.insert}`} />
          <div className={`${s.face} ${s.rings}`}>
            <span className={s.shimmer} />
          </div>
          <div className={s.lid}>
            <div className={`${s.face} ${s.lidTop}`} />
            <div className={`${s.face} ${s.lining}`} />
            <div className={`${s.face} ${s.lidFront}`} />
            <div className={`${s.face} ${s.lidFrontInner}`} />
            <div className={`${s.face} ${s.lidBackInner}`} />
            <div className={`${s.face} ${s.lidLeft}`} />
            <div className={`${s.face} ${s.lidLeftInner}`} />
            <div className={`${s.face} ${s.lidRight}`} />
            <div className={`${s.face} ${s.lidRightInner}`} />
          </div>
        </div>
      </div>
      <div className={s.glow} />
      <div className={s.particles}>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={s.particle} />
        ))}
      </div>
    </div>
  );
}
