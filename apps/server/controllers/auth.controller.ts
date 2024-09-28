import { NextFunction, Request, Response } from "express";
import User from "../models/user.model";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis";

interface NewRequest extends Request {
  user?: any;
}

const generateTokens = (
  userId: string
): { refreshToken: string; accessToken: string } => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: "7d",
  });
  return {
    accessToken,
    refreshToken,
  };
};

const storeRefreshToken = async (userId: string, refreshToken: string) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  );
};

const setCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
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
    const { email, password, name } = req.body;

    const userExists = await User.findOne({ email });
    // user exist or not
    if (userExists)
      return res.status(500).json({ message: "User already exists" });

    // create a user
    const user: any = await User.create({ name, email, password });

    // generate token
    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    // store the refresh token to redis
    await storeRefreshToken(user._id.toString(), refreshToken);

    // set the token in res cookies
    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      message: "User created successfully",
    });
  } catch (e: any) {
    return res
      .status(500)
      .json({ message: "Falied to create your account", error: e.message });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user: any = await User.findOne({ email });
    if (!user) return res.status(500).json({ message: "User does not found" });
    const comparePassword = await user.comparePassword(password);
    if (!comparePassword)
      return res.status(500).json({ message: "Invalid email or password" });

    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    await storeRefreshToken(user._id.toString(), refreshToken);
    setCookies(res, accessToken, refreshToken);
    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (e: any) {
    console.log("Error in login controller", e.message);
    return res.status(500).json({ message: e.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const refreshToken = req.cookies.refreshToken || userId;
    const decoded: any = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    );
    await redis.del(`refresh_token:${decoded.userId}`);

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (e: any) {
    res.status(500).json({ message: "Network Error", error: e.message });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res.status(401).json({ message: "No refresh token provided" });
    const decoded: any = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    );
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (storedToken !== refreshToken)
      return res.status(401).json({ message: "Invalid refresh token" });

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: "15m" }
    );
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: true,
      maxAge: 15 * 60 * 1000,
    });
    res.json({ message: "Token refreshed successfully" });
  } catch (e: any) {
    console.log(e.message);
    res.status(500).json({ message: e.message });
  }
};

// TODO
export const getProfile = async (req: NewRequest, res: Response) => {
  try {
    res.json(req.user);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
