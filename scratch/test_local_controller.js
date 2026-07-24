import { getClients } from '../src/controllers/client.controller.js';
import prisma from '../src/config/db.js';

async function testLocalController() {
  try {
    const superAdminUser = await prisma.user.findFirst({
      where: { id: 74 },
      include: { role: true }
    });

    const mockReq = {
      user: superAdminUser,
      query: { page: 1, limit: 10, clientType: 'Personal' }
    };

    const mockRes = {
      status: (code) => {
        return {
          json: (data) => {
            console.log('API Response Status:', code);
            console.log('API Response Message:', data.message);
            const clients = data.data.clients || data.data;
            console.log('Total Clients in Response:', data.data.total);
            console.log('Page 1 Returned Clients:');
            console.log(JSON.stringify(clients.map((c, i) => ({
              index: i + 1,
              id: c.id,
              name: c.companyName,
              email: c.email,
              clientType: c.clientType,
              source: c.source
            })), null, 2));
          }
        };
      }
    };

    const mockNext = (err) => {
      console.error('Controller error:', err);
    };

    await getClients(mockReq, mockRes, mockNext);

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testLocalController();
