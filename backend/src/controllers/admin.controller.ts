// src/controllers/admin.controller.ts
import { Response } from 'express';
import { adminService } from '../services/admin.service';
import { userQuerySchema, createUserSchema, updateUserSchema, updatePermissionsSchema, updateTeamSchema } from '../validators/admin.schema';
import { AppError } from '../middlewares/errorHandler';

export const adminController = {
  getUsers: async (req: any, res: Response, next: any) => {
    try {
      const query = userQuerySchema.parse(req.query);
      const result = await adminService.getUsers(query);
      
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: { total: result.total, page: query.page, limit: query.limit }
      });
    } catch (error) { next(error); }
  },

  createUser: async (req: any, res: Response, next: any) => {
    try {
      const validData = createUserSchema.parse(req.body);
      const user = await adminService.createUser(validData);
      
      res.status(201).json({ success: true, message: 'Tạo tài khoản nhân viên thành công', data: user });
    } catch (error) { next(error); }
  },

  updateUser: async (req: any, res: Response, next: any) => {
    try {
      const targetUserId = parseInt(req.params.id);
      if (isNaN(targetUserId)) throw new AppError('ID nhân viên không hợp lệ', 400);

      const validData = updateUserSchema.parse(req.body);
      const user = await adminService.updateUser(targetUserId, req.user.nhan_vien_id, validData);
      
      res.status(200).json({ success: true, message: 'Cập nhật thông tin nhân sự thành công', data: user });
    } catch (error) { next(error); }
  },

  getRoles: async (req: any, res: Response, next: any) => {
    try {
      const data = await adminService.getRoles();
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  },

  updateRolePermissions: async (req: any, res: Response, next: any) => {
    try {
      const roleId = parseInt(req.params.id);
      if (isNaN(roleId)) throw new AppError('ID vai trò không hợp lệ', 400);

      const { quyen_han } = updatePermissionsSchema.parse(req.body);
      const data = await adminService.updateRolePermissions(roleId, quyen_han);
      
      res.status(200).json({ success: true, message: 'Cập nhật quyền hạn thành công', data });
    } catch (error) { next(error); }
  },

  getTeams: async (req: any, res: Response, next: any) => {
    try {
      const data = await adminService.getTeams();
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  },

  updateTeamMembers: async (req: any, res: Response, next: any) => {
    try {
      const teamId = parseInt(req.params.id);
      if (isNaN(teamId)) throw new AppError('ID nhóm không hợp lệ', 400);

      const { nhan_vien_ids } = updateTeamSchema.parse(req.body);
      const data = await adminService.updateTeamMembers(teamId, nhan_vien_ids);
      
      res.status(200).json({ success: true, message: 'Cập nhật danh sách thành viên nhóm thành công', data });
    } catch (error) { next(error); }
  },

  getDepartments: async (req: any, res: Response, next: any) => {
    try {
      const data = await adminService.getDepartments();
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  }
};