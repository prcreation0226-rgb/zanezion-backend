import { findAllClients } from '../src/repositories/client.repository.js';

async function testRepoCall() {
  try {
    const result = await findAllClients(null, { page: 1, limit: 10, clientType: 'Personal' });
    console.log('Result Total:', result.total);
    console.log('Result Page 1 Clients:');
    console.log(JSON.stringify(result.clients.map((c, i) => ({
      index: i + 1,
      id: c.id,
      name: c.companyName,
      email: c.email,
      clientType: c.clientType,
      source: c.source,
      createdAt: c.createdAt
    })), null, 2));

  } catch (err) {
    console.error(err);
  }
}

testRepoCall();
