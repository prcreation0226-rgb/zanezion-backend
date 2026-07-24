import * as supportService from './src/services/support.service.js';

(async () => {
  try {
    const res = await supportService.createGuestRequest({
      guest: 'Mr. Bean',
      requested_by: 'Butler',
      request_details: 'Need 5 towels',
      priority: 'high',
      delivery_time: '2026-06-10 15:00'
    }, 1, 1);
    console.log('Created:', res);

    const getRes = await supportService.getGuestRequests(1);
    console.log('Fetched:', getRes.find(r => r.id === res.id));
  } catch (err) {
    console.error(err);
  }
})();
