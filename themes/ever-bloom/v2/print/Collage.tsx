import { Collage as PhotoCollage, type PrintCollageProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';

/** The photo collages (features `collage_*`) in Ever Bloom's typefaces: the couple's names in its script, in every language. */
export default function Collage(props: PrintCollageProps) {
  return (
    <div className={fonts.fonts} style={{ width: '100%', height: '100%' }}>
      <PhotoCollage
        {...props}
        fonts={{
          latin: {
            script: "'EB Script', serif",
            display: "'EB Serif', Georgia, serif",
            body: "'EB Serif', Georgia, serif",
          },
          arabic: {
            script: "'EB Amiri', serif",
            display: "'EB Amiri', serif",
            body: "'EB Amiri', serif",
          },
        }}
      />
    </div>
  );
}
