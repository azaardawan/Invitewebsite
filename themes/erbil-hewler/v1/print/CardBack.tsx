import { ThemeBorder, type PrintCardBackProps } from '@/theme-sdk';
import { BORDER } from '../border';
import fonts from '../fonts.module.css';
import { PostcardBack } from './Postcard';
import p from './print.module.css';

/** Back of the A5 card, landscape: the Hewlêr postcard with the customer's words. */
export default function CardBack(props: PrintCardBackProps) {
  return (
    <div className={`${fonts.fonts} ${p.back}`}>
      <PostcardBack {...props} />
      {props.border ? <ThemeBorder border={props.border} fallback={BORDER} medium="print" /> : null}
    </div>
  );
}
