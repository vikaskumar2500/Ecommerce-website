import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";

interface RequestProps extends Request {
  user?: any;
}

export const protectRoute = async (
  req: RequestProps,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken)
      return res
        .status(401)
        .json({ message: "Unauthorized - No access token provided" });
    try {
      const decoded: any = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET!
      );

      const user = await User.findById(decoded.userId);
      if (!user) return res.status(401).json({ message: "User not found" });

      req.user = user;
      next();
    } catch (e: any) {
      if (e.name === "TokenExpiredError")
        return res
          .status(401)
          .json({ message: "Unauthorized - Access token expired" });
      throw e;
    }
  } catch (e: any) {
    console.log("Error message from ProtectRoute", e.message);
    return res
      .status(401)
      .json({ message: "Unauthorized - Invalid access token" });
  }
};

export const adminRoute = (
  req: RequestProps,
  res: Response,
  next: NextFunction
) => {
  console.log("req user", req?.user);
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ message: "Access denied - Admin only" });
};
