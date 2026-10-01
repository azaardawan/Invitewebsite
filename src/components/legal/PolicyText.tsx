import { parsePolicy } from '@/lib/policy-markup';

/** Renders a policy's light markup as text elements (no HTML from the content is ever interpreted). */
export function PolicyText({ source }: { source: string }) {
  return (
    <div className="flex flex-col gap-4 leading-relaxed">
      {parsePolicy(source).map((b, i) =>
        b.kind === 'h2' ? (
          <h2 key={i} className="mt-4 text-xl font-semibold text-heading">
            {b.text}
          </h2>
        ) : b.kind === 'ul' ? (
          <ul key={i} className="list-disc space-y-1 ps-6">
            {b.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{b.text}</p>
        ),
      )}
    </div>
  );
}
