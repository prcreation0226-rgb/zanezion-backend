import * as notificationService from '../services/notification.service.js';
import { sendResponse } from '../utils/response.js';

export const createNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.createNotification(req.body, req.user.id);
    sendResponse(res, 201, 'Notification created successfully', notification);
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getNotifications(req.user.id, req.query);
    sendResponse(res, 200, 'Notifications fetched successfully', notifications);
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    sendResponse(res, 200, 'Unread count fetched successfully', { count });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    await notificationService.markAsRead(Number(req.params.id), req.user.id);
    sendResponse(res, 200, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    sendResponse(res, 200, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(Number(req.params.id), req.user.id);
    sendResponse(res, 200, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
};
