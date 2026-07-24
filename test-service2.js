import * as supportService from './src/services/support.service.js';

(async () => {
  try {
    const res = await supportService.updateGuestRequest('GRQ-9640', {
      guest: 'Mr. Bean Edited',
      requested_by: 'Butler Edited',
      request_details: 'Need 6 towels',
      priority: 'immediate',
      delivery_time: '2026-06-10 16:00',
      status: 'In Progress'
    }, 1, 1);
    console.log('Updated:', res);
  } catch (err) {
    console.error(err);
  }
})();
