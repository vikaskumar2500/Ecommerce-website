import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getFeaturedProducts,
  getProductByCategory,
  getRecommendedProducts,
  toggleFeaturedProduct,
} from "../controllers/product.controller";
const router = express.Router();



router.get("/category/:category", getProductByCategory);
router.get("/featured", getFeaturedProducts);
router.get("/recommendations", getRecommendedProducts);
router.patch("/:productId", protectRoute, adminRoute, toggleFeaturedProduct);
router.delete("/:productId", protectRoute, adminRoute, deleteProduct);
router.post("/", protectRoute, adminRoute, createProduct);
router.get("/", protectRoute, adminRoute, getAllProducts);

export default router;
