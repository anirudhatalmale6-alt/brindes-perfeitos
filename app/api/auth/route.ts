import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { authenticateUser, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  initializeDatabase();
  const { email, password } = await request.json();

  const user = authenticateUser(email, password);
  if (!user) {
    return NextResponse.json({ error: 'Credenciais invalidas' }, { status: 401 });
  }

  const token = signToken(user);
  const response = NextResponse.json({ success: true, user });
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}

export async function DELETE() {
  initializeDatabase();
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_token');
  return response;
}
