import Link from 'next/link';

/** Shown when a published invitation has expired or was taken down. No platform CSS: inline styles only. */
export function InvitationEnded({ title, body, brand }: { title: string; body: string; brand: string }) {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeContent: 'center',
        gap: 16,
        padding: 24,
        textAlign: 'center',
        background: '#f6ece6',
        color: '#3a1520',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif',
      }}
    >
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>{title}</h1>
      <p style={{ margin: 0, maxWidth: 360, lineHeight: 1.8, color: '#5e4a4f' }}>{body}</p>
      <Link href="/" style={{ marginTop: 12, color: '#6e1f33', fontWeight: 600 }}>
        {brand}
      </Link>
    </main>
  );
}
