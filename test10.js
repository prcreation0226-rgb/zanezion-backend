import http from 'http';

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/users?limit=1000',
  method: 'GET',
  headers: {
    // We need an auth token to hit this endpoint... wait, I can just use prisma directly
  }
};
