import prisma from '../config/db.js';

export const logAudit = ({
  module,
  action,
  description = null,
  oldValue = null,
  newValue = null,
  performedBy
}) => {
  // Fire-and-forget asynchronously - zero overhead on API responses
  if (!performedBy) return Promise.resolve();

  return new Promise((resolve) => {
    setImmediate(async () => {
      try {
        const perfId = Number(performedBy);
        if (isNaN(perfId) || perfId <= 0) return resolve();

        await prisma.auditLog.create({
          data: {
            module: String(module || 'SYSTEM'),
            action: String(action || 'UPDATE'),
            description: description || '',
            oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
            newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
            performedBy: perfId
          }
        }).catch(() => {});
      } catch (_) {
      } finally {
        resolve();
      }
    });
  });
};

