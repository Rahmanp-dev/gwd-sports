import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';
import config from '../env';

export async function authMiddleware(req: NextRequest) {
  await connectToDatabase();
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Access token is required', status: 401 };
  }
  
  const token = authHeader.substring(7);
  if (!token) {
    return { error: 'Access token is required', status: 401 };
  }
  
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    const user = await User.findById(decoded.userId).select('+refreshTokens');
    
    if (!user) {
      return { error: 'Invalid token - user not found', status: 401 };
    }
    
    if (!user.isActive) {
      return { error: 'Account is deactivated', status: 401 };
    }
    
    return { user };
  } catch (error) {
    return { error: 'Authentication error or invalid token', status: 401 };
  }
}

export async function adminMiddleware(req: NextRequest) {
  const auth = await authMiddleware(req);
  if (auth?.error) return auth;
  
  if (auth?.user.role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }
  
  return auth;
}

export async function roleMiddleware(req: NextRequest, roles: string[]) {
  const auth = await authMiddleware(req);
  if (auth?.error) return auth;
  
  if (!roles.includes(auth?.user.role)) {
    return { error: `Access restricted to: ${roles.join(', ')}`, status: 403 };
  }
  
  return auth;
}
