import { Collage as PhotoCollage, type PrintCollageProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';

/** The photo collages (features `collage_*`) written in this design's typefaces, in every language. */
export default function Collage(props: PrintCollageProps) {
  return (
    <div className={fonts.fonts} style={{ width: '100%', height: '100%' }}>
      <PhotoCollage
        {...props}
        fonts={{
          latin: { script: "'PR Script', serif", display: "'PR Sans', sans-serif", body: "'PR Serif', Georgia, serif" },
          arabic: { script: "'PR Ruqaa', serif", display: "'PR Arabic Heading', serif", body: "'PR Arabic', serif" },
        }}
      />
    </div>
  );
}
