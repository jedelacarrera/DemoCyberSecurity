import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3101";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API functions
export const apiClient = {
  // Auth
  login: (username: string, password: string) =>
    api.post("/api/auth/login", { username, password }),

  register: (username: string, email: string, password: string) =>
    api.post("/api/auth/register", { username, email, password }),

  // Generic API call
  call: (method: string, path: string, data?: any) => {
    switch (method.toUpperCase()) {
      case "GET":
        return api.get(path, { params: data });
      case "POST":
        return api.post(path, data);
      case "PUT":
        return api.put(path, data);
      case "DELETE":
        return api.delete(path);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  },
};

export default api;
