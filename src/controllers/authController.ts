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

import Role, { IRole } from "../models/Role";
import mongoose from "mongoose";
import { AuthRequest } from "@middlewares/auth";

const generateTokens = (userId: string, roleName: string, fullName: string) => {
  const payload = { userId, role: roleName, fullName };

  const accessToken = jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN as unknown as jwt.SignOptions['expiresIn'] });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET as string, { expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

  return { accessToken, refreshToken };
};

const setTokensAsCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 2 * 60 * 1000, // 2 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
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
      role:new mongoose.Types.ObjectId("69736b3285d7cf0182c66972"),
    });

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id.toString(), 'Guest', fullName);

    user.refreshToken = refreshToken;
    await user.save();

    setTokensAsCookies(res, accessToken, refreshToken);

    res.status(201).json({
      message: "Signup successful",
      data: { user },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { userName, password } = req.body;

    // Populate role to get permissions
    const user = await User.findOne({ userName }).populate("role");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const roleData = user.role as any;
    
    const { accessToken, refreshToken } = generateTokens(
      user._id.toString(), 
      roleData.name, 
      user.fullName
    );

    user.refreshToken = refreshToken;
    await user.save();

    setTokensAsCookies(res, accessToken, refreshToken);


    // res.cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: 'strict' });
    // res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });

    res.status(200).json({ message: "Login successful", user: { fullName: user.fullName, role: roleData.name } });
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

    const user = await User.findById(decoded.userId).populate("role");
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const roleData = user.role as any;

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id.toString(), roleData.name, user.fullName
    );

    user.refreshToken = newRefreshToken;
    await user.save();

    setTokensAsCookies(res, accessToken, newRefreshToken);

    res.status(200).json({
      message: "Token refreshed successfully",
      // data: { accessToken, refreshToken: newRefreshToken },
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

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    // req.user is already populated by authMiddleware!
    const user = await User.findById(req.user?.userId)
      .select("-password -refreshToken")
      .populate("role");

    res.status(200).json({ user });
  } catch {
    res.status(500).json({ message: "Error fetching user" });
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, permissions, description } = req.body;

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: "Role already exists" });
    }

    const role = new Role({
      name,
      permissions: permissions || [],
    });

    await role.save();
    res.status(201).json({ message: "Role created successfully", role });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};


export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id, name, permissions } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Role id is required" });
    }

    const updatePayload: Partial<IRole> = {};

    if (name) updatePayload.name = name;
    if (Array.isArray(permissions)) updatePayload.permissions = permissions;

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!updatedRole) {
      return res.status(404).json({ message: "Role does not exist" });
    }

    return res.status(200).json({
      message: "Role updated successfully",
      role: updatedRole,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err instanceof Error ? err.message : err,
    });
  }
};


export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const roles = await Role.find();
    res.status(200).json(roles);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


export const getUserByEmployeeId = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    
    // Find user and populate current role details
    const user = await User.findOne({ employeeId })
      .select("-password -refreshToken")
      .populate("role");

    if (!user) {
      return res.status(404).json({ message: "User not found with this Employee Code" });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;

    const targetRole = await Role.findById(roleId);
    if (!targetRole) {
      return res.status(404).json({ message: "The specified role does not exist" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role: roleId },
      { new: true }
    ).populate("role");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ 
      message: `User role updated to ${targetRole.name} successfully`,
      user: updatedUser 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
