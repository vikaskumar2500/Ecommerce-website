import { Request, Response } from "express";
import User from "../models/user.model";
import Product from "../models/product.model";
import Order from "../models/order.model";

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const analyticsData = await getAnalyticsData();
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dailySalesData = getDailySalesData(endDate, startDate);
    res.status(200).json({
      analyticsData,
      dailySalesData,
    });
  } catch (e: any) {
    console.log("Error in getAnalyticsData controller", e.message);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const getAnalyticsData = async () => {
  try {
    const totalUsers = await User.countDocuments();
    const totaProducts = await Product.countDocuments();
    const salesData = await Order.aggregate([
      {
        $group: {
          _id: null, // it groups all documents together
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "totalAmount" },
        },
      },
    ]);
    const { totalSales, totalRevenue } = salesData[0] || {
      totalSales: 0,
      totalRevenue: 0,
    };
    return {
      users: totalUsers,
      products: totaProducts,
      totalSales,
      totalRevenue,
    };
  } catch (e: any) {
    console.log("Error in getAnalyticsData controller", e.message);
    throw e;
  }
};

export const getDailySalesData = async (startDate: Date, endDate: Date) => {
  try {
    const getDailySalesData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "totalAmount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // examples daily sales data
    // [
    //   {
    //     _id:"2024-08-16",
    //     sales:12,
    //     revenue:1453.32,
    //   }
    // ]

    const dateArray = getDatesInRange(startDate, endDate);
    return dateArray.map((date) => {
      const foundData = getDailySalesData.find((item) => item._id === date);
      return {
        date,
        sales: foundData?.sales || 0,
        revenue: foundData?.revenue || 0,
      };
    });
  } catch (e: any) {
    console.log("Error in getDailySalesData", e.message);
    throw e;
  }
};

function getDatesInRange(startDate: Date | string, endDate: Date | string) {
  const dates = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}
