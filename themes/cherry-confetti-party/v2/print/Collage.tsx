import { Collage as PhotoCollage, type PrintCollageProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';

/** The photo collages (features `collage_*`) written in this design's typefaces, in every language. */
export default function Collage(props: PrintCollageProps) {
  return (
    <div className={fonts.fonts} style={{ width: '100%', height: '100%' }}>
      <PhotoCollage
        {...props}
        fonts={{
          latin: { script: "'CC Script', serif", display: "'CC Sans', sans-serif", body: "'CC Serif', Georgia, serif" },
          arabic: { script: "'CC Ruqaa', serif", display: "'CC Arabic Heading', serif", body: "'CC Arabic', serif" },
        }}
      />
    </div>
  );
}
