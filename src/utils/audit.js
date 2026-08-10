import prisma from '../config/db.js';

export const logAudit = async ({
  module,
  action,
  description = null,
  oldValue = null,
  newValue = null,
  performedBy
}) => {
  try {
    if (!performedBy) return; // Prevent crashes if system action

    const validUser = await prisma.user.findUnique({ where: { id: Number(performedBy) } });
    if (!validUser) return;

    await prisma.auditLog.create({
      data: {
        module,
        action,
        description,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        performedBy: validUser.id
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
