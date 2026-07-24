import * as authService from '../services/auth.service.js';
import { sendResponse } from '../utils/response.js';

export const signup = async (req, res, next) => {
  try {
    const user = await authService.signupUser(req.body, req.file);
    user.password = undefined;
    sendResponse(res, 201, 'Signup successful', { user });
  } catch (error) {
    next(error);
  }
};


export const staffRegister = async (req, res, next) => {
  try {
    const user = await authService.registerStaff(req.body, req.files);
    user.password = undefined;
    sendResponse(res, 201, 'Staff Registration successful', { user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, tenantId } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const { user, token, refreshToken, menuPermissions } = await authService.loginUser(email, password, tenantId, ipAddress, userAgent);

    // Remove sensitive data
    user.password = undefined;

    sendResponse(res, 200, 'Login successful', { user, token, refreshToken, menuPermissions });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logoutUser(req.user.id, refreshToken, req.ip, req.headers['user-agent']);
    sendResponse(res, 200, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    sendResponse(res, 200, 'Profile fetched successfully', user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await authService.updateProfile(req.user.id, req.body, req.user.tenantId, req.ip, req.headers['user-agent']);
    sendResponse(res, 200, 'Profile updated successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, req.user.tenantId, currentPassword, newPassword, req.ip, req.headers['user-agent']);
    sendResponse(res, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const message = await authService.forgotPassword(req.body.email, req.body.tenantId);
    sendResponse(res, 200, message);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    sendResponse(res, 200, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const tokens = await authService.refreshToken(req.body.refreshToken, req.ip, req.headers['user-agent']);
    sendResponse(res, 200, 'Token refreshed successfully', tokens);
  } catch (error) {
    next(error);
  }
};
