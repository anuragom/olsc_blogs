// // import { Request, Response, NextFunction } from "express";
// // import jwt from "jsonwebtoken";
// // import User, { IUser } from "../models/User";

// // interface AuthRequest extends Request {
// //   user?: IUser;
// // }

// // export const authMiddleware = async (
// //   req: AuthRequest,
// //   res: Response,
// //   next: NextFunction
// // ) => {
// //   try {
// //     const authHeader = req.headers.authorization;

// //     if (!authHeader || !authHeader.startsWith("Bearer ")) {
// //       return res.status(401).json({ message: "Unauthorized: No token" });
// //     }

// //     const token = authHeader.split(" ")[1];

// //     const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
// //       userId: string;
// //     };

// //     const user = await User.findById(decoded.userId);
// //     if (!user) {
// //       return res.status(401).json({ message: "Unauthorized: User not found" });
// //     }

// //     req.user = user;
// //     next();
// //   } catch (err) {
// //     console.error(err);
// //     return res.status(401).json({ message: "Unauthorized: Invalid token" });
// //   }
// // };


// import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";
// import User, { IUser } from "../models/User";

// export interface AuthRequest extends Request {
//   user?: IUser;
// }

// export const authMiddleware = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const token = req.cookies.accessToken;
//     if (!token) {
//       return res.status(401).json({ message: "Unauthorized: No token" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
//       userId: string;
//     };

//     const user = await User.findById(decoded.userId);
//     if (!user) {
//       return res.status(401).json({ message: "Unauthorized: User not found" });
//     }

//     req.user = user;
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Unauthorized: Invalid token" });
//   }
// };



import { Request, Response, NextFunction } from "express";
import { JWT_SECRET } from "../config/config";
import jwt, { Secret } from "jsonwebtoken";

// 1. Define the exact shape of your Token Payload
export interface TokenPayload {
  userId: string;
  role: string;
  perms: string[];
}

// 2. Extend the Express Request type
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    // 3. Cast the decoded result to your TokenPayload interface
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