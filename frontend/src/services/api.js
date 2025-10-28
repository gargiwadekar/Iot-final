import axios from "axios";

// ✅ For Render combined deployment
const api = axios.create({
  baseURL: "/api"
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;
