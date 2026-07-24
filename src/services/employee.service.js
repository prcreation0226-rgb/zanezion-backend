import bcrypt from 'bcrypt';
import * as employeeRepository from '../repositories/employee.repository.js';
import * as departmentRepository from '../repositories/department.repository.js';
import * as designationRepository from '../repositories/designation.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createEmployee = async (data, performerId, tenantId) => {
  // Check if email already exists in foundation users
  const existingUser = await userRepository.findUserByEmailAndTenant(data.email, tenantId);
  if (existingUser) {
    throw new AppError('Email already in use', 400);
  }

  // Check if employee code already exists
  const existingEmployee = await employeeRepository.findEmployeeByCodeAndTenant(data.employeeCode, tenantId);
  if (existingEmployee) {
    throw new AppError('Employee code already exists in this tenant', 400);
  }

  // Validate department & designation
  const department = await departmentRepository.findDepartmentById(data.departmentId);
  if (!department || (tenantId !== null && department.tenantId !== tenantId)) {
    throw new AppError('Department not found', 404);
  }

  const designation = await designationRepository.findDesignationById(data.designationId);
  if (!designation || designation.departmentId !== data.departmentId || (tenantId !== null && designation.tenantId !== tenantId)) {
    throw new AppError('Designation not found or does not belong to the selected department', 400);
  }

  // Generate a default password for the employee (e.g., ZNZ@Emp2026!)
  const defaultPassword = `ZNZ@${data.employeeCode}!`;
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const userData = {
    tenantId,
    name: `${data.firstName} ${data.lastName}`,
    email: data.email,
    phone: data.phone,
    password: hashedPassword,
    roleId: data.roleId,
    status: data.status || 'active'
  };

  const employeeData = {
    tenantId,
    employeeCode: data.employeeCode,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    departmentId: data.departmentId,
    designationId: data.designationId,
    joiningDate: new Date(data.joiningDate),
    vehicleType: data.vehicleType || null,
    vehiclePlate: data.vehiclePlate || null,
    vehicleModel: data.vehicleModel || null,
    status: data.status || 'active'
  };

  const newEmployee = await employeeRepository.createEmployeeWithUser(userData, employeeData);

  await logAudit({
    module: 'EMPLOYEES',
    action: 'CREATE',
    description: `Created employee ${newEmployee.firstName} ${newEmployee.lastName}`,
    newValue: newEmployee,
    performedBy: performerId
  });

  return newEmployee;
};

export const getEmployees = async (tenantId, query) => {
  return await employeeRepository.findAllEmployees(tenantId, query);
};

export const getEmployeeById = async (id, tenantId) => {
  const employee = await employeeRepository.findEmployeeById(id);
  if (!employee || (tenantId !== null && employee.tenantId !== tenantId)) {
    throw new AppError('Employee not found', 404);
  }
  return employee;
};

export const updateEmployee = async (id, data, tenantId, performerId) => {
  const employee = await getEmployeeById(id, tenantId);

  const employeeUpdateData = {};
  const userUpdateData = {};

  if (data.departmentId && data.departmentId !== employee.departmentId) {
    const department = await departmentRepository.findDepartmentById(data.departmentId);
    if (!department || (tenantId !== null && department.tenantId !== tenantId)) throw new AppError('Department not found', 404);
    employeeUpdateData.departmentId = data.departmentId;
  }

  if (data.designationId && data.designationId !== employee.designationId) {
    const depId = employeeUpdateData.departmentId || employee.departmentId;
    const designation = await designationRepository.findDesignationById(data.designationId);
    if (!designation || designation.departmentId !== depId || (tenantId !== null && designation.tenantId !== tenantId)) {
      throw new AppError('Designation not found or does not match department', 400);
    }
    employeeUpdateData.designationId = data.designationId;
  }

  if (data.firstName) employeeUpdateData.firstName = data.firstName;
  if (data.lastName) employeeUpdateData.lastName = data.lastName;
  if (data.phone) {
    employeeUpdateData.phone = data.phone;
    userUpdateData.phone = data.phone;
  }
  if (data.status) {
    employeeUpdateData.status = data.status;
    userUpdateData.status = data.status;
  }
  if (data.roleId) {
    userUpdateData.roleId = data.roleId;
  }
  if (data.joiningDate) {
    employeeUpdateData.joiningDate = new Date(data.joiningDate);
  }
  if (data.vehicleType !== undefined) employeeUpdateData.vehicleType = data.vehicleType;
  if (data.vehiclePlate !== undefined) employeeUpdateData.vehiclePlate = data.vehiclePlate;
  if (data.vehicleModel !== undefined) employeeUpdateData.vehicleModel = data.vehicleModel;

  if (data.firstName || data.lastName) {
    const fName = data.firstName || employee.firstName;
    const lName = data.lastName || employee.lastName;
    userUpdateData.name = `${fName} ${lName}`;
  }

  const updatedEmployee = await employeeRepository.updateEmployeeAndUser(id, employee.userId, employeeUpdateData, userUpdateData);

  await logAudit({
    module: 'EMPLOYEES',
    action: 'UPDATE',
    description: `Updated employee ${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
    oldValue: employee,
    newValue: updatedEmployee,
    performedBy: performerId
  });

  return updatedEmployee;
};

export const deleteEmployee = async (id, tenantId, performerId) => {
  const employee = await getEmployeeById(id, tenantId);

  await employeeRepository.deleteEmployeeAndUser(id, employee.userId);

  await logAudit({
    module: 'EMPLOYEES',
    action: 'DELETE',
    description: `Deleted employee ${employee.firstName} ${employee.lastName}`,
    oldValue: employee,
    performedBy: performerId
  });

  return true;
};
