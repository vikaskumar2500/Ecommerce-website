import axios from "axios";

const axiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:3000/api"
      : "http://localhost:3000/api",
  withCredentials: true, // send cookies to server
});

export default axiosInstance;
