import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

type Admin = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
};

app.post('/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();

  const admin = await c.env.DB.prepare(`SELECT id, name, email, password_hash FROM admins WHERE email = ?`)
    .bind(email)
    .first<Admin>();

  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return c.json({ error: 'invalid email or password' }, 401);
  }

  const token = await sign(
    { sub: admin.id, email: admin.email, exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 },
    c.env.JWT_SECRET
  );

  return c.json({ token });
});

export default app;
