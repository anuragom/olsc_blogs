import { Request, Response, NextFunction } from "express";

const WRITE_KEY = process.env.BLOG_WRITE_KEY;

export const checkWriteKey = (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers["x-blog-key"] as string;

  if (!key || key !== WRITE_KEY) {
    return res.status(403).json({ message: "Forbidden: invalid or missing API key" });
  }

  next();
};
