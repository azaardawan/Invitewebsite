'use client';

import { Component, type ReactNode } from 'react';
import styles from './platform.module.css';

/**
 * If a theme crashes in the browser, only this invitation shows a calm
 * fallback; nothing else on the site is affected.
 */
export class ThemeErrorBoundary extends Component<
  { children: ReactNode; message: string; retry: string; codeRef: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Reported to error monitoring once it is configured (M11).
    console.error(`[theme ${this.props.codeRef}]`, error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className={styles.fallback} role="alert">
        <p>{this.props.message}</p>
        <button type="button" onClick={() => this.setState({ failed: false })}>
          {this.props.retry}
        </button>
      </div>
    );
  }
}
