import { Request, Response } from "express";
import User from "../models/User";
import jwt, { Secret } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
} from "../config/config";

const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign(
    { userId, role },
    JWT_SECRET as string,
    { expiresIn: JWT_EXPIRES_IN as unknown as jwt.SignOptions['expiresIn'] }
  );

  const refreshToken = jwt.sign(
    { userId, role },
    JWT_REFRESH_SECRET as string,
    { expiresIn: JWT_REFRESH_EXPIRES_IN as unknown as jwt.SignOptions['expiresIn'] }
  );

  return { accessToken, refreshToken };
};

const setTokensAsCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 2 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { userName, fullName, password, employeeId } = req.body;

    const existingUser = await User.findOne({ userName });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      userName,
      fullName,
      password: hashedPassword,
      employeeId,
    });

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id.toString(), 'sanjvikAdmin');

    user.refreshToken = refreshToken;
    await user.save();

    setTokensAsCookies(res, accessToken, refreshToken);

    res.status(201).json({
      message: "Signup successful",
      data: { accessToken, refreshToken, user },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { userName, password } = req.body;

    const user = await User.findOne({ userName });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.role);

    user.refreshToken = refreshToken;
    await user.save();

    setTokensAsCookies(res, accessToken, refreshToken);

    res.status(200).json({
      message: "Login successful",
      data: { accessToken, refreshToken, user },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken)
      return res.status(401).json({ message: "Refresh token is required" });

    const decoded = jwt.verify(
      refreshToken,
      JWT_REFRESH_SECRET as Secret
    ) as jwt.JwtPayload;

    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id.toString(), user.role
    );

    user.refreshToken = newRefreshToken;
    await user.save();

    setTokensAsCookies(res, accessToken, newRefreshToken);

    res.status(200).json({
      message: "Token refreshed successfully",
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token required" });

    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return res.status(401).json({ message: "No access token" });

    const decoded = jwt.verify(token, JWT_SECRET as Secret) as jwt.JwtPayload;
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};