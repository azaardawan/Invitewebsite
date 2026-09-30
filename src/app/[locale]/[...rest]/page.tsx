import { notFound } from 'next/navigation';

/** Sends unknown localized paths to the localized not-found page. */
export default function CatchAll() {
  notFound();
}
