import * as trackingRepository from '../repositories/tracking.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createTracking = async (data, performerId, tenantId) => {
  const existing = await trackingRepository.findTrackingByTrackerId(data.id, tenantId);
  if (existing) {
    throw new AppError('Tracking ID already exists', 400);
  }

  const payload = {
    trackerId: data.id,
    asset: data.asset,
    location: data.location,
    signal: data.signal,
    eta: data.eta,
    status: data.status,
    tenantId
  };

  const tracking = await trackingRepository.createTracking(payload);

  await logAudit({
    module: 'TRACKING',
    action: 'CREATE',
    description: `Initiated sync for asset ${data.asset}`,
    newValue: tracking,
    performedBy: performerId
  });

  return { ...tracking, id: tracking.trackerId };
};

export const getTracking = async (tenantId) => {
  const trackings = await trackingRepository.findAllTracking(tenantId);
  return trackings.map(t => ({ ...t, id: t.trackerId }));
};

export const updateTracking = async (id, data, tenantId, performerId) => {
  const existing = await trackingRepository.findTrackingByTrackerId(id, tenantId);
  if (!existing) {
    throw new AppError('Tracking record not found', 404);
  }

  const payload = {
    asset: data.asset,
    location: data.location,
    signal: data.signal,
    eta: data.eta,
    status: data.status
  };

  const updated = await trackingRepository.updateTracking(id, tenantId, payload);

  await logAudit({
    module: 'TRACKING',
    action: 'UPDATE',
    description: `Updated tracking for asset ${data.asset}`,
    oldValue: existing,
    newValue: updated,
    performedBy: performerId
  });

  return { ...updated, id: updated.trackerId };
};

export const deleteTracking = async (id, tenantId, performerId) => {
  const existing = await trackingRepository.findTrackingByTrackerId(id, tenantId);
  if (!existing) {
    throw new AppError('Tracking record not found', 404);
  }

  await trackingRepository.deleteTracking(id, tenantId);

  await logAudit({
    module: 'TRACKING',
    action: 'DELETE',
    description: `Deleted tracking for asset ${existing.asset}`,
    oldValue: existing,
    performedBy: performerId
  });

  return true;
};
