import { Request, Response, NextFunction } from 'express';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from './config/db';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
  },
});

//Database
prisma
  .$connect()
  .then(() => console.log('Connexion réussie!'))
  .catch((err) => {
    console.error('Échec de la connexion :', err);
    process.exit(1);
  });

app.get('/', (req: Request, res: Response) => {
  res.send('Salut');
});

// Au signal d’arrêt, on ferme proprement Prisma
process.on('SIGINT', async () => {
  console.log('Fermeture du serveur…');
  await prisma.$disconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});
