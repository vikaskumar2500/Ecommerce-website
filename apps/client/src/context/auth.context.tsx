import axios from "axios";
import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "sonner";
import { IoCloseCircleOutline } from "react-icons/io5";

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
  signup: (data: Signup) => void;
  login: (data: Login) => void;
  logout: () => void;
  user: User | null;
  checkAuth: () => void;
  checkingAuth: boolean;
  refreshToken: () => void;
}

export const AuthContext = createContext<CreateContext>({
  signup: () => {},
  login: () => {},
  logout: () => {},
  user: null,
  checkingAuth: true,
  checkAuth: () => {},
  refreshToken: () => {},
});

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const logout = async () => {
    const res = axios.post("/auth/logout", {});
    toast.promise(res, {
      loading: "Please wait...",
      success: (res) => {
        setUser(null);
        return res.data.message;
      },
      error: (e) => {
        console.log("Error in logout context", e.message);
        if (e.response && e.response.data) return e.response.data.message;

        return e.message;
      },
      cancel: {
        label: <IoCloseCircleOutline size={20} />,
        onClick: (e) => e.preventDefault(),
      },
      cancelButtonStyle: {
        outline: "none",
        backgroundColor: "whitesmoke",
        color: "black",
      },
    });
  };
  const login = async ({ email, password }: Login) => {
    const res = axios.post("/auth/signin", { email, password });
    toast.promise(res, {
      loading: "Wait for a while, Loading...",
      success: (res) => {
        setUser(res.data);
        return `${res.data.name} logged in successfully`;
      },
      error: (e) => {
        console.log("Error in login context", e.message);
        if (e.response && e.response.data) return e.response.data.message;

        return e.message;
      },
      cancel: {
        label: <IoCloseCircleOutline size={20} />,
        onClick: (e) => e.preventDefault(),
      },
      cancelButtonStyle: {
        outline: "none",
        backgroundColor: "whitesmoke",
        color: "black",
      },
    });
  };

  const signup = async ({ email, name, password }: Signup) => {
    const res = axios.post("/auth/signup", { email, name, password });

    toast.promise(res, {
      loading: "Wait for a while, Loading...",
      success: (res) => {
        setUser(res.data);
        return `${res.data.name} account created successfully`;
      },
      error: (e) => {
        console.log("Error in signup context", e.message);
        if (e.response && e.response.data) return e.response.data.message;
        return e.message;
      },
      cancel: {
        label: <IoCloseCircleOutline size={20} />,
        onClick: (e) => e.preventDefault(),
      },
      cancelButtonStyle: {
        outline: "none",
        backgroundColor: "whitesmoke",
        color: "black",
      },
    });
  };

  const checkAuth = async () => {
    setCheckingAuth(true);
    try {
      const response = await axios.get("/auth/profile");
      setUser(response.data);
      setCheckingAuth(false);
    } catch (e: any) {
      console.log(e.message);
      setCheckingAuth(false);
      setUser(null);
    }
  };

  const refreshToken = async () => {
    // Prevent multiple simultaneous refresh attempts
    if (checkingAuth) return;

    setCheckingAuth(true);
    try {
      const response = await axios.post("/auth/refresh-token");
      setCheckingAuth(false);
      return response.data;
    } catch (error) {
      setUser(null);
      setCheckingAuth(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        checkAuth,
        checkingAuth,
        refreshToken,
        signup,
        login,
        logout,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Axios interceptor for token refresh
let refreshPromise: any = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If a refresh is already in progress, wait for it to complete
        if (refreshPromise) {
          await refreshPromise;
          return axios(originalRequest);
        }

        // Start a new refresh process
        refreshPromise = useContext(AuthContext).refreshToken();
        await refreshPromise;
        refreshPromise = null;

        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login or handle as needed
        useContext(AuthContext).logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
