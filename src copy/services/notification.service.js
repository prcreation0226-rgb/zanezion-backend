import * as notificationRepository from '../repositories/notification.repository.js';
import { logAudit } from '../utils/audit.js';

export const createNotification = async (data, performerId) => {
  const notification = await notificationRepository.createNotification(data);

  await logAudit({
    module: 'NOTIFICATIONS',
    action: 'CREATE',
    description: `Created notification for user ${data.userId}`,
    newValue: notification,
    performedBy: performerId
  });

  return notification;
};

export const getNotifications = async (userId, query) => {
  return await notificationRepository.findNotificationsByUser(userId, query);
};

export const getUnreadCount = async (userId) => {
  return await notificationRepository.getUnreadCount(userId);
};

export const markAsRead = async (id, userId) => {
  return await notificationRepository.markAsRead(id, userId);
};

export const markAllAsRead = async (userId) => {
  return await notificationRepository.markAllAsRead(userId);
};

export const deleteNotification = async (id, userId) => {
  return await notificationRepository.deleteNotification(id, userId);
};
