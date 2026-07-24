import * as clientService from '../src/services/client.service.js';

async function testClientService() {
  try {
    console.log('Testing clientService.getClients(null, { page: 1, limit: 10, clientType: "Personal" })...');
    const result = await clientService.getClients(null, { page: 1, limit: 10, clientType: 'Personal' });
    console.log('Total returned:', result.total);
    console.log('Clients List:');
    console.log(JSON.stringify(result.clients.map((c, i) => ({
      index: i + 1,
      id: c.id,
      companyName: c.companyName,
      email: c.email,
      clientType: c.clientType,
      source: c.source,
      createdAt: c.createdAt
    })), null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testClientService();
