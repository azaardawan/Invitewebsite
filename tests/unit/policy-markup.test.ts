import { describe, expect, it } from 'vitest';
import { parsePolicy } from '@/lib/policy-markup';

describe('policy markup', () => {
  it('turns headings, lists and paragraphs into plain blocks', () => {
    expect(parsePolicy('Intro line one\nline two\n\n## Heading\n- a\n- b\nAfter list')).toEqual([
      { kind: 'p', text: 'Intro line one line two' },
      { kind: 'h2', text: 'Heading' },
      { kind: 'ul', items: ['a', 'b'] },
      { kind: 'p', text: 'After list' },
    ]);
  });

  it('keeps HTML as literal text', () => {
    expect(parsePolicy('<script>alert(1)</script>')).toEqual([{ kind: 'p', text: '<script>alert(1)</script>' }]);
  });
});
