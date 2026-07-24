import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(2, 'Code must be at least 2 characters').max(20),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  departmentId: z.number().int().positive('Department ID is required'),
  designationId: z.number().int().positive('Designation ID is required'),
  roleId: z.number().int().positive('Role ID is required for system access'),
  joiningDate: z.string().datetime({ message: 'Invalid joining date format' }),
  status: z.enum(['active', 'inactive']).optional()
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().optional(),
  departmentId: z.number().int().positive().optional(),
  designationId: z.number().int().positive().optional(),
  roleId: z.number().int().positive().optional(),
  joiningDate: z.string().datetime().optional(),
  status: z.enum(['active', 'inactive']).optional()
});
