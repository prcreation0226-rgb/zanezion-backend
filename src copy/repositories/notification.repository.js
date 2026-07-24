import prisma from '../config/db.js';

export const createNotification = async (data) => {
  return await prisma.notification.create({ data });
};

export const findNotificationsByUser = async (userId, query) => {
  const { isRead } = query;
  const where = { userId };
  if (isRead !== undefined) {
    where.isRead = isRead === 'true';
  }

  return await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
};

export const getUnreadCount = async (userId) => {
  return await prisma.notification.count({
    where: { userId, isRead: false }
  });
};

export const markAsRead = async (id, userId) => {
  return await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true }
  });
};

export const markAllAsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });
};

export const deleteNotification = async (id, userId) => {
  return await prisma.notification.deleteMany({
    where: { id, userId }
  });
};
