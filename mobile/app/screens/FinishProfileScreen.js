import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScrollScreen from "../components/ScrollScreen";
import AuthButton from "../components/AuthButton";
import theme from "../theme";

function parseDateInput(value) {
  const match = String(value || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(d.getTime())) return null;
  const max = new Date();
  max.setFullYear(max.getFullYear() - 16);
  if (d > max) return null;
  return d;
}

function validateProfile(form) {
  if (!form.firstName?.trim()) return "Enter your first name";
  if (!form.lastName?.trim()) return "Enter your last name";
  if (!form.email?.trim()) return "Enter your email";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    return "Enter a valid email";
  if (!form.dateOfBirthText?.trim()) return "Enter your date of birth";
  if (!parseDateInput(form.dateOfBirthText))
    return "Use format YYYY-MM-DD (must be 16+ years old)";
  return null;
}

/**
 * Shown once, right after auth succeeds (phone OTP verified, or Google
 * sign-in done) and before entering the app. Same screen for both paths:
 *  - Phone path: all fields start empty.
 *  - Google path: firstName/lastName/email pre-filled from Google via
 *    `initialProfile`; email is locked since it's tied to the Google account.
 * DOB is always empty and always required, since neither auth method
 * provides it.
 */
export default function FinishProfileScreen({
  role = "client",
  initialProfile = null,
  onBack,
  onSubmit,
}) {
  const isFundi = role === "fundi";
  const roleLabel = isFundi ? "I am a Fundi" : "Find a Fundi";
  const roleIcon = isFundi ? "build" : "search";
  const pillBg = theme.colors.accentDim;

  const emailLocked = Boolean(initialProfile?.email);

  const [form, setForm] = useState({
    firstName: initialProfile?.firstName || "",
    lastName: initialProfile?.lastName || "",
    email: initialProfile?.email || "",
    dateOfBirthText: "",
  });
  const [focused, setFocused] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!initialProfile) return;
    setForm((p) => ({
      ...p,
      firstName: initialProfile.firstName || p.firstName,
      lastName: initialProfile.lastName || p.lastName,
      email: initialProfile.email || p.email,
    }));
  }, [initialProfile]);

  const set = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));

  const inputRowStyle = (key) => [
    styles.inputRow,
    focused === key && styles.inputRowFocused,
  ];

  const handleSubmit = async () => {
    const err = validateProfile(form);
    if (err) {
      Alert.alert("Check your details", err);
      return;
    }
    const dob = parseDateInput(form.dateOfBirthText);
    setSubmitting(true);
    try {
      await onSubmit?.({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        dateOfBirth: dob?.toISOString(),
        role,
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollScreen keyboard contentStyle={styles.scroll} bottomPad={32}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={theme.colors.white} />
        </TouchableOpacity>

        <View style={[styles.rolePill, { backgroundColor: pillBg }]}>
          <View style={styles.rolePillIcon}>
            <Ionicons name={roleIcon} size={12} color={theme.colors.black} />
          </View>
          <Text style={styles.rolePillText}>{roleLabel}</Text>
        </View>
      </View>

      <Text style={styles.title}>Finish setting up</Text>
      <Text style={styles.subtitle}>
        {emailLocked
          ? "We pulled your name and email from Google. Add your date of birth to finish."
          : "Just a few details to finish creating your account."}
      </Text>

      <Text style={styles.sectionLabel}>FIRST NAME</Text>
      <View style={inputRowStyle("firstName")}>
        <Ionicons
          name="person-outline"
          size={18}
          color={theme.colors.muted}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          value={form.firstName}
          onChangeText={set("firstName")}
          placeholder="e.g. John"
          placeholderTextColor={theme.colors.mutedDark}
          autoCapitalize="words"
          onFocus={() => setFocused("firstName")}
          onBlur={() => setFocused(null)}
        />
      </View>

      <Text style={styles.sectionLabel}>LAST NAME</Text>
      <View style={inputRowStyle("lastName")}>
        <Ionicons
          name="person-outline"
          size={18}
          color={theme.colors.muted}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          value={form.lastName}
          onChangeText={set("lastName")}
          placeholder="e.g. Mukasa"
          placeholderTextColor={theme.colors.mutedDark}
          autoCapitalize="words"
          onFocus={() => setFocused("lastName")}
          onBlur={() => setFocused(null)}
        />
      </View>

      <Text style={styles.sectionLabel}>EMAIL ADDRESS</Text>
      <View
        style={
          emailLocked ? styles.inputRowLocked : inputRowStyle("email")
        }
      >
        <Ionicons
          name="mail-outline"
          size={18}
          color={emailLocked ? theme.colors.mutedDark : theme.colors.muted}
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, emailLocked && { color: theme.colors.mutedDark }]}
          value={form.email}
          onChangeText={set("email")}
          placeholder="e.g. john@example.com"
          placeholderTextColor={theme.colors.mutedDark}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!emailLocked}
          onFocus={() => setFocused("email")}
          onBlur={() => setFocused(null)}
        />
        {emailLocked && (
          <Ionicons name="lock-closed" size={14} color={theme.colors.mutedDark} />
        )}
      </View>
      {emailLocked && (
        <Text style={styles.helper}>Email is locked to your Google account.</Text>
      )}

      <Text style={styles.sectionLabel}>DATE OF BIRTH</Text>
      <View style={inputRowStyle("dob")}>
        <Ionicons
          name="calendar-outline"
          size={18}
          color={theme.colors.muted}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          value={form.dateOfBirthText}
          onChangeText={set("dateOfBirthText")}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.colors.mutedDark}
          keyboardType="numbers-and-punctuation"
          onFocus={() => setFocused("dob")}
          onBlur={() => setFocused(null)}
        />
      </View>
      <Text style={styles.helper}>Must match the name on your national ID.</Text>

      <AuthButton
        variant="phone"
        label="Finish setup"
        loading={submitting}
        onPress={handleSubmit}
        style={{ marginTop: 18 }}
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 8 },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.card ?? theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  rolePill: {
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.3)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    paddingLeft: 8,
  },
  rolePillIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  rolePillText: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: "700",
  },

  title: {
    color: theme.colors.white,
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 14.5,
    lineHeight: 21,
    marginBottom: 26,
  },

  sectionLabel: {
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 11.5,
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 18,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.input,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 10,
  },
  inputRowFocused: {
    borderColor: theme.colors.accent,
  },
  inputRowLocked: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.input,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 10,
    opacity: 0.7,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: theme.colors.white, fontSize: 15.5, padding: 0 },
  helper: {
    color: theme.colors.mutedDark,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 4,
  },
});