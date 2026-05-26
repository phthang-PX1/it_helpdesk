// src/controllers/sla.controller.ts
import { Response } from 'express';
import { slaService } from '../services/sla.service';
import { getSlaPoliciesQuerySchema, createSlaSchema, updateSlaSchema } from '../validators/sla.schema';
import { AppError } from '../middlewares/errorHandler';

export const slaController = {
  getPolicies: async (req: any, res: Response, next: any) => {
    try {
      const query = getSlaPoliciesQuerySchema.parse(req.query);
      const data = await slaService.getPolicies(query);
      
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  },

  createPolicy: async (req: any, res: Response, next: any) => {
    try {
      const validData = createSlaSchema.parse(req.body);
      const result = await slaService.createPolicy(validData);
      
      res.status(201).json({ 
        success: true, 
        message: 'Tạo chính sách SLA thành công', 
        data: result 
      });
    } catch (error) { next(error); }
  },

  updatePolicy: async (req: any, res: Response, next: any) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new AppError('ID chính sách không hợp lệ', 400);

      const validData = updateSlaSchema.parse(req.body);
      const result = await slaService.updatePolicy(id, validData);
      
      res.status(200).json({ 
        success: true, 
        message: 'Cập nhật chính sách SLA thành công', 
        data: result 
      });
    } catch (error) { next(error); }
  }
};