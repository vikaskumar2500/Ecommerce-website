import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";

// routes
import authRoutes from "./routes/auth.route";
import productRoutes from "./routes/product.route";
import cartRoutes from "./routes/cart.route";
import couponRoutes from "./routes/coupon.route";
import paymentRoutes from "./routes/payment.route";
import analyticRoutes from "./routes/analytic.route";

import { connectDB } from "./lib/db";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(helmet());
app.use(cookieParser());
app.use(cors(corsOptions));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/anlytics", analyticRoutes);

app.listen(PORT, async () => {
  console.log(`Server is running on ${PORT}`);
  await connectDB();
});
