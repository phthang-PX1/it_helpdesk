// src/validators/attachment.schema.ts
import { z } from 'zod';

export const ticketIdParamSchema = z.object({
  ticket_id: z.string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().min(1, "Mã Ticket không hợp lệ"))
});

export const attachmentIdParamSchema = z.object({
  id: z.string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().min(1, "Mã File đính kèm không hợp lệ"))
});