import { Request, Response, NextFunction } from 'express';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from './config/db';
import dotenv from 'dotenv';
import session from 'express-session';
import authRoutes from './routes/auth.routes';
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
  },
});

app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.json());

//Database
prisma
  .$connect()
  .then(() => console.log('Connexion réussie!'))
  .catch((err) => {
    console.error('Échec de la connexion :', err);
    process.exit(1);
  });

// app.get('/', (req: Request, res: Response) => {
//   res.send('Salut');
// });
app.use('/auth', authRoutes);

// Home route
app.get('/', (req, res) => {
  if ((req.session as any).user) {
    res.json({ message: 'User logged in', user: (req.session as any).user });
  } else {
    res.json({ message: 'User not logged in' });
  }
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
