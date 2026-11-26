import divider from './assets/divider.svg';
import s from './theme.module.css';

/** The owner's starburst divider, in the design's bronze. */
export function Divider({ small = false, className = '' }: { small?: boolean; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- decorative artwork
  return <img className={`${s.divider} ${small ? s.dividerSmall : ''} ${className}`} src={divider.src} alt="" aria-hidden="true" />;
}
