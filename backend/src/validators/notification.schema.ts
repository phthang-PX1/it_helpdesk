// src/validators/notification.schema.ts
import { z } from 'zod';

export const notificationQuerySchema = z.object({
  page: z.string().optional().transform(val => (val ? Number(val) : 1)).pipe(z.number().min(1)),
  limit: z.string().optional().transform(val => (val ? Number(val) : 10)).pipe(z.number().max(100)),
  da_doc: z.string().optional().transform(val => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  })
});

export const notificationParamSchema = z.object({
  id: z.string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().min(1, "ID thông báo không hợp lệ"))
});