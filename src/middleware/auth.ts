import { Request, Response, NextFunction } from "express";
import { JWT_SECRET } from "../config/config";
import jwt, { Secret } from "jsonwebtoken";
import User from "@models/User";

// 1. Define the exact shape of your Token Payload
export interface TokenPayload {
  userId: string;
  role: string;
  fullName: string;
}

export interface AuthRequest extends Request {
  user?: TokenPayload & { perms: string[] };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET as Secret) as TokenPayload;

    // Fetch the latest permissions from DB
    // Optimization: Use .lean() for faster read
    const user = await User.findById(decoded.userId).populate("role").lean();
    
    if (!user || !user.role) {
      return res.status(401).json({ message: "User or Role no longer exists" });
    }

    const roleData = user.role as any;

    // Attach user data AND permissions to the request object
    req.user = {
      ...decoded,
      perms: roleData.permissions || []
    }; 
    
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorize = (requiredPermission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const hasPermission = 
      req.user.role === 'SuperAdmin' || 
      req.user.perms.includes(requiredPermission) || 
      req.user.perms.includes('*:*');

    if (!hasPermission) return res.status(403).json({ message: "Forbidden" });
    next();
  };
};