import * as ImageManipulator from "expo-image-manipulator";
import Constants from "expo-constants";
import { Platform } from "react-native";

const getMediaBaseUrl = () => {
  const explicitUrl =
    process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl;
  if (explicitUrl) return explicitUrl.replace(/\/api\/?$/, "");

  if (Platform.OS === "web") return "http://localhost:5000";

  const hostUri = Constants.expoConfig?.hostUri || "";
  const host = hostUri.split(":")[0];
  if (host) return `http://${host}:5000`;

  return "http://localhost:5000";
};

const API_BASE = getMediaBaseUrl();

export const compressImage = async (uri) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1080 } }],
    {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );
  return result.uri;
};

/** Build a full media URL from an absolute URL or server-relative path. */
export function resolveMediaUrl(path, cacheBust) {
  if (!path) return "";
  const base = path.startsWith("http")
    ? path
    : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  return cacheBust
    ? `${base}${base.includes("?") ? "&" : "?"}t=${cacheBust}`
    : base;
}
