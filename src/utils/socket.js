import { Server } from 'socket.io';
import { config } from '../config/env.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // We allow all origins for now as configured in app.js
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Optional: Clients can join a room based on their tenantId or userId
    socket.on('join_tenant', (tenantId) => {
      if (tenantId) {
        socket.join(`tenant_${tenantId}`);
        console.log(`Client ${socket.id} joined tenant room: tenant_${tenantId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

export const emitToTenant = (tenantId, event, payload) => {
  if (io && tenantId) {
    io.to(`tenant_${tenantId}`).emit(event, payload);
  } else if (io) {
    io.emit(event, payload);
  }
};
