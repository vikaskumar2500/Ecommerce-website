import { Request, Response } from "express";
import Product from "../models/product.model";
import { redis } from "../lib/redis";
import cloudinary from "../lib/cloudinary";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({}).lean();
    console.log("products", products);
    res.status(200).json(products);
  } catch (e: any) {
    console.log(e.message);
    res.status(500).json({ message: e.message });
  }
};

export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) return res.json(JSON.parse(featuredProducts));

    // if not in redis then fetching from database.
    // .lean() returns a plain js object instead of a mongodb document.
    // Which is good for performance
    featuredProducts = (await Product.find({ isFeatured: true }).lean()) as any;

    if (!featuredProducts)
      return res.status(404).json({ message: "No featured products found" });

    // store in the redis for future quick access
    await redis.set("featured_products", JSON.stringify(featuredProducts));

    res.status(200).json(featuredProducts);
  } catch (e: any) {
    console.log("Error in getFunction controller", e.message);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, image, category } = req.body;
    let cloudinaryResponse = null;
    if (image) {
      try{
        // we will get the image url from cloudinary
        cloudinaryResponse = await cloudinary.uploader.upload(image, {
          use_filename: true,
          unique_filename: false,
          overwrite: true,
          folder:'products',
        });
      }catch(e){ 
        throw e;
      }
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url || "",
      category,
    });
    res.status(201).json(product);
  } catch (e: any) {
    console.log("Error while creating product",e.message);
    res
      .status(500)
      .json({ message: "Failed to create product", error: e.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.image) {
      const publicId = product.image.split("/").pop()?.split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("Deleted image from cloudinary");
      } catch (e: any) {
        console.log("error while deleting image from cloudinary", e.message);
      }
    }
    await Product.findByIdAndDelete(req.params.productId);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (e: any) {
    console.log("Error in delete product", e.message);
    res.status(500).json({ message: "Failed to delete", error: e.message });
  }
};

export const getRecommendedProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: { size: 3 },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]);
    res.status(200).json(products);
  } catch (e: any) {
    console.log("Error in get recommended products controller", e.message);
    res
      .status(500)
      .json({ messgae: "Failed to get Recommeded Products", error: e.message });
  }
};

export const getProductByCategory = async (req: Request, res: Response) => {
  
  try {
    const { category } = req.params;
    
    const products = (await Product.find({ category }).lean()) as any;
    res.status(200).json(products);
  } catch (e: any) {
    console.log("Error in get category controller", e.message);
    res
      .status(500)
      .json({ message: "Failed to get Product by category", error: e.message });
  }
};

export const toggleFeaturedProduct = async (req: Request, res: Response) => {
  const { productId } = req.params;
  console.log("productId", productId);
  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(401).json({ message: "Product not found" });
    product.isFeatured = !product.isFeatured;
    const updatedProdcut = await product.save();
    await updateFeatureProductsCache();
    res.status(200).json(updatedProdcut);
  } catch (e: any) {
    console.log("Error in toggleFeaturedProduct", e.message);
    res
      .status(500)
      .json({ message: "Failed to get product", error: e.message });
  }
};

const updateFeatureProductsCache = async () => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (e: any) {
    console.log("Error in update the cache function", e.message);
  }
};
