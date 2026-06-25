const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');
const initSocket = require('./sockets/chat.socket');
const { autoReleasePayments } = require('./services/escrow.service');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure logs directory exists
const logsDir = path.resolve('logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: [config.clientUrl, config.adminUrl, 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
  },
});

initSocket(io);

// Auto-release escrow payments every hour
setInterval(autoReleasePayments, 60 * 60 * 1000);

server.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
});

module.exports = server;
