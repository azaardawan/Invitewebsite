/**
 * Light markup for legal texts, parsed into plain blocks (never HTML):
 * `## Heading`, `- list item`, and blank lines between paragraphs.
 */
export type PolicyBlock = { kind: 'h2'; text: string } | { kind: 'p'; text: string } | { kind: 'ul'; items: string[] };

export function parsePolicy(source: string): PolicyBlock[] {
  const blocks: PolicyBlock[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: 'p', text: para.join(' ') });
    if (list.length) blocks.push({ kind: 'ul', items: list });
    para = [];
    list = [];
  };
  for (const raw of source.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) flush();
    else if (line.startsWith('## ')) {
      flush();
      blocks.push({ kind: 'h2', text: line.slice(3).trim() });
    } else if (/^[-•]\s+/.test(line)) {
      if (para.length) {
        blocks.push({ kind: 'p', text: para.join(' ') });
        para = [];
      }
      list.push(line.replace(/^[-•]\s+/, ''));
    } else {
      if (list.length) {
        blocks.push({ kind: 'ul', items: list });
        list = [];
      }
      para.push(line);
    }
  }
  flush();
  return blocks;
}
