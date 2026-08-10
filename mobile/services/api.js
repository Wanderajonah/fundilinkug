import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

const getBaseUrl = () => {
  const explicitUrl =
    process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl;
  if (explicitUrl) return explicitUrl;

  if (Platform.OS === "web") {
    return "http://localhost:5000/api";
  }

  const hostUri = Constants.expoConfig?.hostUri || "";
  const host = hostUri.split(":")[0];
  if (host) {
    return `http://${host}:5000/api`;
  }

  return "http://localhost:5000/api";
};

const BASE_URL = getBaseUrl();

export const getSocketUrl = () => BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
});

export const setAuthToken = (token) => {
  api.defaults.headers.common.Authorization = token ? `Bearer ${token}` : "";
};

export const getPlatformPricing = () => api.get("/platform-settings");

export default api;
export { BASE_URL };
