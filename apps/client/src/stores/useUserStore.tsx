import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "sonner";

enum ROLE {
  "CUSTOMER" = "customer",
  "ADMIN" = "admin",
}

interface Login {
  email: string;
  password: string;
}

interface Signup {
  email: string;
  password: string;
  name: string;
}

export interface User {
  name: string;
  email: string;
  role: ROLE;
  _id: string;
}
interface CreateContext {
  loading: boolean;
  user: User | null;
  checkingAuth: boolean;
  signup: (data: Signup) => Promise<void>;
  login: (data: Login) => Promise<void>;
  logout: (userId: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const useUserStore = create<CreateContext>((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  signup: async ({ name, email, password }: Signup) => {
    set({ loading: true });

    try {
      const res = await axios.post("/auth/signup", { name, email, password });
      set({ user: res.data, loading: false });
    } catch (error: any) {
      set({ loading: false });
      toast.error(error.response.data.message || "An error occurred");
    }
  },
  login: async ({ email, password }: Login) => {
    set({ loading: true });
    try {
      const res = await axios.post("/auth/signin", { email, password });
      set({ user: res.data, loading: false });
    } catch (error: any) {
      toast.error(error.response.data.message || "An error occurred");
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },

  logout: async (userId: string) => {
    try {
      await axios.post("/auth/logout", { userId });
      set({ user: null });
    } catch (error: any) {
      toast.error(
        error.resonse?.data?.message || "An error occurred during logout"
      );
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axios.get("/auth/profile");
      set({ user: response.data, checkingAuth: false });
    } catch (error: any) {
      console.log(error.message);
      set({ checkingAuth: false, user: null });
    }
  },

  refreshToken: async () => {
    // Prevent multiple simultaneous refresh attempts
    if (get().checkingAuth) return;

    set({ checkingAuth: true });
    try {
      const response = await axios.post("/auth/refresh-token");
      set({ checkingAuth: false });
      return response.data;
    } catch (error) {
      set({ user: null, checkingAuth: false });
      throw error;
    }
  },
}));

// TODO: Implement the axios interceptors for refreshing access token

// Axios interceptor for token refresh
let refreshPromise: any = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log("inceptors message", originalRequest);
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // If a refresh is already in progress, wait for it to complete
        if (refreshPromise) {
          await refreshPromise;
          return axios(originalRequest);
        }

        // Start a new refresh process
        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;

        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login or handle as needed
        const userId = useUserStore.getState().user?._id;
        await useUserStore.getState().logout(userId || "");
        // return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
