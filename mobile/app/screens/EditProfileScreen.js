import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";

import * as ImagePicker from "expo-image-picker";

import theme from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import {
  getProfile,
  updateProfile,
  updateUserLocation,
  uploadProfilePicture,
} from "../../services/usersApi";
import { resolveMediaUrl } from "../../utils/image";
import { initials } from "../utils/ratings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditProfileScreen({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  const user = profile?.user || {};
  const fundiProfile = profile?.fundiProfile || {};

  const [profilePhotoUri, setProfilePhotoUri] = useState("");
  const [photoChanged, setPhotoChanged] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [locationText, setLocationText] = useState("");
  const [bio, setBio] = useState("");

  const avatarInitials = useMemo(() => {
    const name = fullName || user?.name || user?.firstName || "JD";
    return initials(name || "JD");
  }, [fullName, user?.name, user?.firstName]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const { data } = await getProfile();
        if (cancelled) return;
        setProfile(data);

        // `getProfile()` returns: { user, fundiProfile }
        // user model fields: name, email, phone, locationLabel, address, etc.
        const name =
          (typeof data?.user?.name === "string" && data.user.name) ||
          [data?.user?.firstName, data?.user?.lastName]
            .filter(Boolean)
            .join(" ");

        setFullName(name || "");
        setEmail(data?.user?.email || "");
        setPhone(data?.user?.phone || "");
        setLocationText(data?.user?.locationLabel || data?.user?.address || "");
        setBio(fundiProfile?.bio || "");

        setProfilePhotoUri(
          data?.user?.profilePhoto
            ? resolveMediaUrl(data.user.profilePhoto)
            : data?.user?.avatarUrl ||
                data?.user?.avatar ||
                data?.user?.imageUrl ||
                "",
        );

        // Debug logging
        console.log(
          "EditProfile - Profile photo URL:",
          data?.user?.profilePhoto
            ? `${process.env.EXPO_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000"}${data.user.profilePhoto}`
            : "No profile photo",
        );
        console.log(
          "EditProfile - EXPO_PUBLIC_API_URL:",
          process.env.EXPO_PUBLIC_API_URL,
        );
      } catch (e) {
        if (cancelled) return;
        setProfile(null);
        Alert.alert("Could not load profile", "Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const validate = () => {
    if (!fullName.trim()) return "Full name is required.";
    if (email && !EMAIL_RE.test(String(email).trim())) {
      return "Email looks invalid.";
    }
    return null;
  };

  const pickProfilePhoto = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow access to your photos.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const uri = result.assets?.[0]?.uri;
      if (!uri) return;

      setProfilePhotoUri(uri);
      setPhotoChanged(true);
    } catch (e) {
      Alert.alert("Photo error", "Could not pick a profile photo.");
    }
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Fix form", err);
      return;
    }

    try {
      setSaving(true);

      // Upload profile photo if changed
      if (photoChanged && profilePhotoUri) {
        const formData = new FormData();
        formData.append("profilePicture", {
          uri: profilePhotoUri,
          type: "image/jpeg",
          name: "profile.jpg",
        });

        setUploadingPhoto(true);
        try {
          const { data: uploadData } = await uploadProfilePicture(formData);
          const uploadedPath =
            uploadData?.profilePhotoUrl || uploadData?.user?.profilePhoto;
          if (uploadedPath) {
            setProfilePhotoUri(resolveMediaUrl(uploadedPath, Date.now()));
          }
          setPhotoChanged(false);
        } finally {
          setUploadingPhoto(false);
        }
      }

      const payload = {
        // Backend `updateProfile` updates arbitrary user fields from req.body.
        // Use fields that exist on backend `User` model.
        name: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      };

      // `bio` is stored on `FundiProfile` for fundis; safe to send if provided.
      if (bio.trim()) payload.bio = bio.trim();

      await updateProfile(payload);

      // Location update intentionally skipped here.
      // Backend `updateUserLocation` expects numeric lat/lng (and likely a different payload shape),
      // while this form currently captures a free-text location label/address.
      // Location is handled in the dedicated SetLocation flow.

      const { data } = await getProfile();
      setProfile(data);
      if (data?.user?.profilePhoto) {
        setProfilePhotoUri(resolveMediaUrl(data.user.profilePhoto, Date.now()));
      }

      Alert.alert(
        "Saved",
        "Your profile changes have been updated (server confirmed).",
      );
    } catch (e) {
      // Show actual backend error if available
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Unknown error";

      // Helpful for debugging in Metro/console
      // eslint-disable-next-line no-console
      console.log("EditProfile save error:", {
        status: e?.response?.status,
        data: e?.response?.data,
        message,
      });

      Alert.alert("Save failed", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => onNavigate?.("profile")}
            style={styles.iconBtn}
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.saveBtn, (saving || loading) && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <ActivityIndicator color="#0B0B0B" size="small" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.accent} size="large" />
            <Text style={styles.loadingText}>Loading profile…</Text>
          </View>
        ) : (
          <>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                {profilePhotoUri ? (
                  <Image
                    source={{ uri: profilePhotoUri }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>{avatarInitials}</Text>
                )}
                {uploadingPhoto ? (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator color={theme.colors.accent} />
                  </View>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={pickProfilePhoto}
                disabled={uploadingPhoto || saving}
              >
                <Text style={styles.addText}>＋</Text>
              </TouchableOpacity>
              <Text style={styles.changeText}>Change Photo</Text>
            </View>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoCapitalize="words"
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="john.doe@email.com"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+256 771 123 456"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={locationText}
              onChangeText={setLocationText}
              placeholder="Kampala, Uganda"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <Text style={styles.label}>Bio (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <Text style={styles.sectionTitle}>Account Settings</Text>
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bgDark },
  container: { paddingHorizontal: 16, paddingBottom: 80 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    marginBottom: 16,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { color: "#F3F3F3", fontSize: 22 },
  title: { color: "#F3F3F3", fontWeight: "900" },
  saveBtn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  saveText: { color: "#0B0B0B", fontWeight: "900", fontSize: 12 },

  avatarWrap: { alignItems: "center", marginBottom: 18 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(245,158,11,0.25)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarText: { color: "#F3F3F3", fontWeight: "900", fontSize: 22 },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    position: "absolute",
    right: 120,
    top: 55,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { color: "#0B0B0B", fontWeight: "900" },
  changeText: { color: theme.colors.accent, marginTop: 8, fontWeight: "800" },

  label: { color: "rgba(255,255,255,0.6)", marginBottom: 6, fontSize: 12 },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#F3F3F3",
    marginBottom: 12,
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },

  sectionTitle: { color: "rgba(255,255,255,0.5)", marginTop: 8 },
});
