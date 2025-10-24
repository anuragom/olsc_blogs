import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { 
  JWT_SECRET, 
  JWT_EXPIRES_IN, 
  JWT_REFRESH_SECRET, 
  JWT_REFRESH_EXPIRES_IN 
} from "../config/config";
import ms from "ms";

export const generateAccessToken = (payload: object) => {
    const options: SignOptions = {
          expiresIn: JWT_EXPIRES_IN as unknown as ms.StringValue,
    };
  return jwt.sign(payload, JWT_SECRET as Secret, options);
};

export const generateRefreshToken = (payload: object) => {
    const options: SignOptions = {
          expiresIn: JWT_REFRESH_EXPIRES_IN as unknown as ms.StringValue,
    };
  return jwt.sign(payload, JWT_REFRESH_SECRET as Secret, options);
};
