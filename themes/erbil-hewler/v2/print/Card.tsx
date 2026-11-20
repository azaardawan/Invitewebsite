import { ThemeBorder, type PrintCardProps } from '@/theme-sdk';
import { BORDER } from '../border';
import fonts from '../fonts.module.css';
import { PosterFace } from './Poster';
import p from './print.module.css';

/** Printable invitation, A5 portrait: the designer's wedding poster with the couple's details. The QR is on the back's stamp. */
export default function Card(props: PrintCardProps) {
  return (
    <div className={`${fonts.fonts} ${p.card}`}>
      <PosterFace {...props} />
      {props.border ? <ThemeBorder border={props.border} fallback={BORDER} medium="print" /> : null}
    </div>
  );
}
