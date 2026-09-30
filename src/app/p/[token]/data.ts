import 'server-only';
import { cache } from 'react';
import { db } from '@/server/db/client';
import { findByPreviewToken } from '@/server/orders/drafts';

/** Shared by the layout and the page (one query per request). */
export const previewInvitation = cache(async (token: string) => findByPreviewToken(db(), token));
