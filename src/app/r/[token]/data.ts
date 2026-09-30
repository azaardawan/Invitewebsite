import 'server-only';
import { cache } from 'react';
import { db } from '@/server/db/client';
import { getReceipt } from '@/server/orders/receipt';

export const receiptFor = cache(async (token: string) => getReceipt(db(), token));
