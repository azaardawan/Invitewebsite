import { Collage as PhotoCollage, type PrintCollageProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';

/** The photo collages (features `collage_*`) written in this design's typefaces, in every language. */
export default function Collage(props: PrintCollageProps) {
  return (
    <div className={fonts.fonts} style={{ width: '100%', height: '100%' }}>
      <PhotoCollage
        {...props}
        fonts={{
          latin: { script: "'BF Script', serif", display: "'BF Sans', sans-serif", body: "'BF Serif', Georgia, serif" },
          arabic: { script: "'BF Ruqaa', serif", display: "'BF Arabic Heading', serif", body: "'BF Arabic', serif" },
        }}
      />
    </div>
  );
}
