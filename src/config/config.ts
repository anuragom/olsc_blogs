// src/config/config.ts
export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1m";

export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!JWT_REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET is not defined");

export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

export const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST ,
  port: parseInt(process.env.EMAIL_PORT || ""),
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER || "", // e.g., vishalh@olsc.in
    pass: process.env.EMAIL_PASS || "", // Your App Password
  },
  from: process.env.EMAIL_FROM || "",
};
