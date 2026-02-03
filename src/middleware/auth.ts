import { Request, Response, NextFunction } from "express";
import { JWT_SECRET } from "../config/config";
import jwt, { Secret } from "jsonwebtoken";

// 1. Define the exact shape of your Token Payload
export interface TokenPayload {
  userId: string;
  role: string;
  perms: string[];
  fullName: string[];
}

// 2. Extend the Express Request type
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET as Secret) as TokenPayload;
    
    req.user = decoded; 
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorize = (requiredPermission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const hasPermission = req.user.perms.includes(requiredPermission) || req.user.role === 'SuperAdmin';
    if (!hasPermission) return res.status(403).json({ message: "Forbidden" });
    next();
  };
};