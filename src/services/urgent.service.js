import * as urgentRepository from '../repositories/urgent.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createAlert = async (data, performerId, tenantId) => {
  let alertId = data.id;
  if (!alertId || String(alertId).trim() === '') {
    alertId = `UGA-${Math.floor(1000 + Math.random() * 8999)}`;
  }

  const existing = await urgentRepository.findAlertByAlertId(alertId, tenantId);
  if (existing) {
    throw new AppError('Alert ID already exists.', 400);
  }

  const payload = {
    alertId,
    task: data.task || 'Urgent Mission',
    priority: data.priority || 'Critical',
    time: String(data.time || ''),
    location: String(data.location || ''),
    assignee: data.assignee || 'Pending',
    status: data.status || 'Active',
    tenantId
  };

  const alert = await urgentRepository.createUrgentAlert(payload);

  await logAudit({
    module: 'URGENT',
    action: 'CREATE',
    description: `Logged urgent alert ${alert.task}`,
    newValue: alert,
    performedBy: performerId
  });

  return { ...alert, id: alert.alertId };
};

export const getAlerts = async (tenantId) => {
  const alerts = await urgentRepository.findAllAlerts(tenantId);
  return alerts.map(a => ({ ...a, id: a.alertId }));
};

export const updateAlert = async (id, data, tenantId, performerId) => {
  const existing = await urgentRepository.findAlertByAlertId(id, tenantId);
  if (!existing) {
    throw new AppError('Urgent Alert not found', 404);
  }

  const payload = {
    task: data.task !== undefined ? data.task : existing.task,
    priority: data.priority !== undefined ? data.priority : existing.priority,
    time: data.time !== undefined ? String(data.time) : existing.time,
    location: data.location !== undefined ? String(data.location) : existing.location,
    assignee: data.assignee !== undefined ? data.assignee : existing.assignee,
    status: data.status !== undefined ? data.status : existing.status
  };

  const updated = await urgentRepository.updateAlert(id, tenantId, payload);

  await logAudit({
    module: 'URGENT',
    action: 'UPDATE',
    description: `Updated urgent alert ${updated.task}`,
    oldValue: existing,
    newValue: updated,
    performedBy: performerId
  });

  return { ...updated, id: updated.alertId };
};

export const deleteAlert = async (id, tenantId, performerId) => {
  const existing = await urgentRepository.findAlertByAlertId(id, tenantId);
  if (!existing) {
    throw new AppError('Urgent Alert not found', 404);
  }

  await urgentRepository.deleteAlert(id, tenantId);

  await logAudit({
    module: 'URGENT',
    action: 'DELETE',
    description: `Deleted urgent alert ${existing.task}`,
    oldValue: existing,
    performedBy: performerId
  });

  return true;
};
