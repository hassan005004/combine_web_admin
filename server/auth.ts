import bcrypt from 'bcrypt';
import session from 'express-session';
import type { Express, RequestHandler } from 'express';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-123456',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  
  // Initialize with default admin user
  await initializeDefaultUser();
}

async function initializeDefaultUser() {
  try {
    const existingUser = await storage.getUserByEmail('admin@gmail.com');
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await storage.createUser({
        email: 'admin@gmail.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
      });
      console.log('Default admin user created: admin@gmail.com / 123456');
    }
  } catch (error) {
    console.error('Error initializing default user:', error);
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.session && (req.session as any).userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export async function loginUser(email: string, password: string) {
  try {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}