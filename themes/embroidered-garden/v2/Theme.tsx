'use client';

import type { ThemeProps } from '@/theme-sdk';
import { StoryDesign, designData } from './designs';
import styles from './design.module.css';

/**
 * This design has no online invitation (files only). The page shows the story, so the storefront sample
 * and the customer's preview look like what they buy.
 */
export default function EmbroideredGardenTheme(props: ThemeProps) {
  return (
    <main className={styles.page}>
      <div className={styles.phoneBox}>
        <StoryDesign d={designData(props)} variant="story" />
      </div>
    </main>
  );
}
