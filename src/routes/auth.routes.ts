import express, { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);
console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);

router.get('/google', (req, res) => {
  const url = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['profile', 'email'],
  });
  console.log(url);
  res.redirect(url);
});

router.get(
  '/google/callback',
  async (req: Request, res: Response): Promise<void> => {
    const code = req.query.code as string;
    //http://localhost:3000/google/callback?code=abc123
    console.log('Request URL:', req.originalUrl);
    // console.log('code:', code);

    if (!code) {
      res.status(400).json({ error: 'Authorization code not provided.' });
      return;
    }

    try {
      const { tokens } = await client.getToken(code);

      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        res.status(400).json({ error: 'Invalid token payload' });
        return;
      }

      (req.session as any).user = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      };

      res.redirect('/');
    } catch (error) {
      console.error('Google OAuth error:', error);
      res.status(500).json({ error: 'Authentication failed.' });
    }
  }
);

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to logout.' });
      return;
    }
    res.redirect('/');
  });
});

export default router;
