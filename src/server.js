import http from 'http';
import app from './app.js';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { initSocket } from './utils/socket.js';
import { execSync } from 'child_process';

dotenv.config();

const PORT = process.env.PORT || 8000;
const prisma = new PrismaClient();

async function startServer() {
  try {
    // Check DB Connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    console.log('🚀 Server started with Personal clients cross-tenant fix v2.0');

    // Wrap Express app with HTTP server
    const server = http.createServer(app);

    // Initialize Socket.io
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`🚀 ZaneZion Foundation Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database', error);
    process.exit(1);
  }
}

startServer();
