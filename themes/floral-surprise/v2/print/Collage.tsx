import { Collage as PhotoCollage, type PrintCollageProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';

/** The photo collages (features `collage_*`) written in this design's typefaces, in every language. */
export default function Collage(props: PrintCollageProps) {
  return (
    <div className={fonts.fonts} style={{ width: '100%', height: '100%' }}>
      <PhotoCollage
        {...props}
        fonts={{
          latin: { script: "'FS Script', serif", display: "'FS Sans', sans-serif", body: "'FS Serif', Georgia, serif" },
          arabic: { script: "'FS Ruqaa', serif", display: "'FS Arabic Heading', serif", body: "'FS Arabic', serif" },
        }}
      />
    </div>
  );
}
