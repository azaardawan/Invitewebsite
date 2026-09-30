import { getTranslations } from 'next-intl/server';

/** Details → Review → Payment. */
export async function OrderSteps({ current }: { current: 0 | 1 | 2 }) {
  const t = await getTranslations('store');
  const steps = [t('stepDetails'), t('stepReview'), t('stepPay')];
  return (
    <ol className="flex items-center gap-2 text-sm">
      {steps.map((s, i) => (
        <li key={s} aria-current={i === current ? 'step' : undefined} className="flex flex-1 flex-col gap-2">
          <span className={`h-1.5 rounded-full ${i <= current ? 'bg-accent' : 'bg-line'}`} />
          <span className={i === current ? 'font-semibold text-accent' : 'text-muted'}>{s}</span>
        </li>
      ))}
    </ol>
  );
}
