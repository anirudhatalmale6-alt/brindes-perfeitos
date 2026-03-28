import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getDb } from './db';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'brindes-perfeitos-secret-key-2024';

export interface AdminUser {
  id: number;
  email: string;
  name: string;
}

export function signToken(user: AdminUser): string {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AdminUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function authenticateUser(email: string, password: string): AdminUser | null {
  const db = getDb();
  const user = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email) as {
    id: number; email: string; password_hash: string; name: string;
  } | undefined;

  if (!user) return null;
  if (!bcrypt.compareSync(password, user.password_hash)) return null;

  return { id: user.id, email: user.email, name: user.name };
}
