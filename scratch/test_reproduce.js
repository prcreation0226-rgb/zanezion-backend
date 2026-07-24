import prisma from '../src/config/db.js';
import * as deliveryService from '../src/services/delivery.service.js';

async function reproduceBug() {
  try {
    const data = {
      "orderId": null,
      "clientId": 51,
      "driver": null,
      "assigned_driver": null,
      "missionType": "Chauffeur",
      "transportMode": "Road",
      "vehicleRef": "SUV-01",
      "requestDate": "2026-07-16T10:00:00.000Z",
      "dueDate": "2026-07-16T12:00:00.000Z",
      "pickupLocation": "HQ",
      "dropLocation": "Client Office",
      "items": [
        {
          "id": "uuid-123",
          "name": "Asset",
          "qty": 1,
          "orderItemId": null,
          "itemId": 1
        }
      ]
    };
    
    // Performer: Logistics user (tenantId = 1)
    await deliveryService.createDelivery(data, 1, 1);
    console.log("Success");
  } catch (err) {
    console.log("ERROR:");
    console.log(err.name);
    console.log(err.code);
    console.log(err.message);
    if (err.meta) console.log(err.meta);
  } finally {
    await prisma.$disconnect();
  }
}

reproduceBug();
