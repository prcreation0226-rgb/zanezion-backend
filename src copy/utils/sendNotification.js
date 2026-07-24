import prisma from '../config/db.js';

/**
 * Send a notification to a specific user
 */
export const sendNotification = async ({ userId, title, message, type = 'info' }) => {
  try {
    if (!userId) return;
    await prisma.notification.create({
      data: { userId: Number(userId), title, message, type }
    });
  } catch (err) {
    console.error('[Notification] Failed to send:', err.message);
  }
};

/**
 * Send notification to the performer + all admins in the same tenant
 */
export const notifyTenantAdmins = async ({ tenantId, title, message, type = 'info', performerId = null }) => {
  try {
    const where = {
      status: 'active',
      role: { name: { in: ['SUPER_ADMIN', 'ADMIN'] } }
    };
    if (tenantId) where.tenantId = Number(tenantId);

    const admins = await prisma.user.findMany({ where, select: { id: true } });
    const userIds = new Set(admins.map(u => u.id));
    if (performerId) userIds.add(Number(performerId));

    const notifs = Array.from(userIds).map(uid => ({
      userId: uid, title, message, type
    }));

    if (notifs.length > 0) {
      await prisma.notification.createMany({ data: notifs });
    }
  } catch (err) {
    console.error('[Notification] Failed to notify admins:', err.message);
  }
};
