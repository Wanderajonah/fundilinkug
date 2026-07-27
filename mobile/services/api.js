import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

const getBaseUrl = () => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      return `http://${host}:5000/api`;
    }
    return "http://localhost:5000/api";
  }

  const explicitUrl =
    process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl;
  if (explicitUrl) return explicitUrl;

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

export default api;
export { BASE_URL };
