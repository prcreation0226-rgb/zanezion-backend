import * as settingsService from '../services/settings.service.js';
import { sendResponse } from '../utils/response.js';

export const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings();
    sendResponse(res, 200, 'Settings fetched successfully', settings);
  } catch (error) {
    next(error);
  }
};

export const updateSetting = async (req, res, next) => {
  try {
    const updated = await settingsService.updateSetting(req.params.key, req.body.value, req.user.id);
    sendResponse(res, 200, 'Setting updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const getSystemSettings = async (req, res, next) => {
  try {
    const settingsList = await settingsService.getSettings();
    const result = {
      pricing: { chauffeur_base_price: '50.00', delivery_base_price: '25.00', pickup_charges: '10.00', per_km_charges: '2.50' },
      shipping_modes: { Road: 0, Sea: 150, Air: 300 },
      delivery_tiers: [
        { id: 1, min: 0, max: 20, price: '15' },
        { id: 2, min: 21, max: 50, price: '30' },
        { id: 3, min: 51, max: 100, price: '50' }
      ],
      branding: { businessName: 'ZaneZion', tagline: 'Institutional management and luxury asset tracking.', logo: '' }
    };
    
    settingsList.forEach(s => {
      try {
        if (s.key === 'system_pricing') result.pricing = JSON.parse(s.value);
        if (s.key === 'shipping_modes') result.shipping_modes = JSON.parse(s.value);
        if (s.key === 'delivery_tiers') result.delivery_tiers = JSON.parse(s.value);
        if (s.key === 'system_branding') result.branding = JSON.parse(s.value);
      } catch(e) {}
    });

    sendResponse(res, 200, 'System settings fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const updateSystemSettings = async (req, res, next) => {
  try {
    const { type, data } = req.body;
    let keyToUpdate = 'system_pricing';
    let dataToSave = req.body;
    
    if (type === 'shipping_modes') { keyToUpdate = 'shipping_modes'; dataToSave = data; }
    else if (type === 'delivery_tiers') { keyToUpdate = 'delivery_tiers'; dataToSave = data; }
    else if (type === 'branding') { keyToUpdate = 'system_branding'; dataToSave = data; }
    else if (type === 'pricing') { keyToUpdate = 'system_pricing'; dataToSave = data; }
    
    await settingsService.updateSetting(keyToUpdate, JSON.stringify(dataToSave), req.user.id);
    sendResponse(res, 200, 'System settings updated successfully', dataToSave);
  } catch (error) {
    next(error);
  }
};

export const getUserNotifications = async (req, res, next) => {
  try {
    const key = `user_notifications_${req.user.id}`;
    const settingsList = await settingsService.getSettings();
    const notifSetting = settingsList.find(s => s.key === key);
    let notifs = { emailAlerts: true, pushNotifications: false, orderUpdates: true, securityLogs: true };
    if (notifSetting) {
      try { notifs = JSON.parse(notifSetting.value); } catch(e) {}
    }
    sendResponse(res, 200, 'User notifications fetched successfully', notifs);
  } catch (error) {
    next(error);
  }
};

export const updateUserNotifications = async (req, res, next) => {
  try {
    const key = `user_notifications_${req.user.id}`;
    await settingsService.updateSetting(key, JSON.stringify(req.body), req.user.id);
    sendResponse(res, 200, 'User notifications updated successfully', req.body);
  } catch (error) {
    next(error);
  }
};
