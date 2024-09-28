import { create } from "zustand";
import { toast } from "sonner";
import axios from "../lib/axios";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}
interface CreateProduct {
  products: Product[];
  loading: boolean;
  error: string | null;
  setProducts: (products: Product[]) => void;
  createProduct: (product: any) => Promise<void>;
  fetchAllProducts: () => Promise<void>;
  fetchProductsByCategory: (category: any) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  toggleFeaturedProduct: (productId: string) => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
}

export const useProductStore = create<CreateProduct>((set) => ({
  products: [],
  loading: false,
  error: null,

  setProducts: (products: Product[]) => set({ products }),
  createProduct: async (productData: any) => {
    set({ loading: true });
    try {
      const res = await axios.post("/products", productData);
      set((prevState) => ({
        products: [...prevState.products, res.data],
        loading: false,
      }));
    } catch (error: any) {
      toast.error(error.response.data.error);
      set({ loading: false });
    } finally {
      set({ loading: false });
    }
  },
  fetchAllProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios("/products");
      set({ products: response.data, loading: false });
    } catch (e: any) {
      set({ error: "Failed to fetch products", loading: false });
      toast.error(e.response.data.error || "Failed to fetch products");
    }
  },
  fetchProductsByCategory: async (category: any) => {
    set({ loading: true });
    try {
      const response = await axios.get(`/products/category/${category}`);
      set({ products: response.data.products, loading: false });
    } catch (error: any) {
      set({ error: "Failed to fetch products", loading: false, products: [] });
      toast.error(error.response.data.error || "Failed to fetch products");
    } finally {
      set({ loading: false });
    }
  },
  deleteProduct: async (productId: string) => {
    set({ loading: true });
    try {
      await axios.delete(`/products/${productId}`);
      set((prevProducts) => ({
        products: prevProducts.products.filter(
          (product) => product._id !== productId
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ loading: false });
      toast.error(error.response.data.error || "Failed to delete product");
    }
  },
  toggleFeaturedProduct: async (productId: string) => {
    set({ loading: true });
    try {
      const response = await axios.patch(`/products/${productId}`);
      // this will update the isFeatured prop of the product
      set((prevProducts) => ({
        products: prevProducts.products.map((product) =>
          product._id === productId
            ? { ...product, isFeatured: response.data.isFeatured }
            : product
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ loading: false });
      toast.error(error.response.data.error || "Failed to update product");
    }
  },
  fetchFeaturedProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/products/featured");
      console.log("response", response.data);
      set({ products: response.data, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
      console.log("Error fetching featured products:", error);
    }
  },
}));
