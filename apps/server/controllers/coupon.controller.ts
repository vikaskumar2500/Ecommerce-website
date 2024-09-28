import { NextFunction, Request, Response } from "express";
import Coupon from "../models/coupon.model";
import User from "../models/user.model";

interface NewRequest extends Request {
  user?: any;
}

export const getCoupon = async(req:NewRequest, res:Response)=> {
  try{
    const coupon=await Coupon.findOne({userId:req.user._id, isActive:true});
    return res.json(coupon||null);

  }catch(e:any){
    console.log("Error in getCoupon controller", e.message);
    res.status(500).json({message:'Server error', error:e.message});
  }
}


export const validateCoupon = async (req: NewRequest, res: Response) => {
  try {
    const {code} = req.body;
    const coupon = await Coupon.findOne({
      code:code,
      userId: req.user._id,
      isActive: true,
    });

    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(404).json({ message: "Coupon expired" });
    }

    res.json({
      message: "Coupon is valid",
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (e: any) {
    console.log("Error in validate coupon controller", e.message);
    res.status(500).json({message:"Server error", error:e.message});
  }
};
