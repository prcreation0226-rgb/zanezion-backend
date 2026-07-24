import * as settingsRepository from '../repositories/settings.repository.js';
import { logAudit } from '../utils/audit.js';

export const getSettings = async () => {
  return await settingsRepository.getSettings();
};

export const updateSetting = async (key, value, performerId) => {
  const oldValue = await settingsRepository.getSettingByKey(key);
  const updated = await settingsRepository.updateSetting(key, value);

  await logAudit({
    module: 'SETTINGS',
    action: 'UPDATE',
    description: `Updated setting ${key}`,
    oldValue: oldValue ? { value: oldValue.value } : null,
    newValue: { value },
    performedBy: performerId
  });

  return updated;
};
