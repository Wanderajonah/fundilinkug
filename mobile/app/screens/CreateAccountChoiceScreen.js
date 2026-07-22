import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScrollScreen from "../components/ScrollScreen";
import AuthButton from "../components/AuthButton";
import theme from "../theme";

/**
 * Collects first/last name up front (required by the phone-register
 * backend endpoint), then lets the user pick Phone or Google.
 *  - Phone path: name fields are required here, carried into the OTP
 *    register call. Email + DOB are collected afterward on
 *    FinishProfileScreen.
 *  - Google path: name fields here are optional/skippable — Google
 *    supplies its own name + email, which will pre-fill FinishProfileScreen
 *    regardless of what (if anything) was typed here.
 */
export default function CreateAccountChoiceScreen({
  role = "client",
  onBack,
  onPhoneContinue,
  onGoogleContinue,
}) {
  const isFundi = role === "fundi";
  const roleLabel = isFundi ? "I am a Fundi" : "Find a Fundi";
  const roleIcon = isFundi ? "build" : "search";
  const pillBg = theme.colors.accentDim;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [focused, setFocused] = useState(null);

  const nameOk = Boolean(firstName.trim() && lastName.trim());

  const inputRowStyle = (key) => [styles.inputRow, focused === key && styles.inputRowFocused];

  const handlePhone = () => {
    if (!nameOk) {
      Alert.alert("Almost there", "Enter your first and last name to continue.");
      return;
    }
    onPhoneContinue?.({
      role,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
  };

  const handleGoogle = () => {
    // Name fields are optional for Google — Google's own profile data
    // takes precedence on FinishProfileScreen regardless.
    onGoogleContinue?.({ role });
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

      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>
        Tell us your name, then choose how to verify your details.
      </Text>

      <Text style={styles.sectionLabel}>FIRST NAME</Text>
      <View style={inputRowStyle("firstName")}>
        <Ionicons name="person-outline" size={18} color={theme.colors.muted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="e.g. John"
          placeholderTextColor={theme.colors.mutedDark}
          autoCapitalize="words"
          onFocus={() => setFocused("firstName")}
          onBlur={() => setFocused(null)}
        />
      </View>

      <Text style={styles.sectionLabel}>LAST NAME</Text>
      <View style={inputRowStyle("lastName")}>
        <Ionicons name="person-outline" size={18} color={theme.colors.muted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="e.g. Mukasa"
          placeholderTextColor={theme.colors.mutedDark}
          autoCapitalize="words"
          onFocus={() => setFocused("lastName")}
          onBlur={() => setFocused(null)}
        />
      </View>
      <Text style={styles.helper}>
        Required for phone sign-up. Skip if you're continuing with Google.
      </Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="call-outline" size={18} color={theme.colors.muted} />
          <Text style={styles.cardTitle}>Phone number</Text>
        </View>
        <Text style={styles.cardSubtext}>
          We'll text you a one-time code, then ask for your email and date of birth.
        </Text>
        <AuthButton
          variant="phone"
          label="Continue with Phone Number"
          onPress={handlePhone}
          style={{ marginTop: 14 }}
        />
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="logo-google" size={18} color={theme.colors.muted} />
          <Text style={styles.cardTitle}>Google</Text>
        </View>
        <Text style={styles.cardSubtext}>
          We'll pull your name and email from Google automatically.
        </Text>
        <AuthButton
          variant="google"
          label="Continue with Google"
          onPress={handleGoogle}
          style={{ marginTop: 14 }}
        />
      </View>

      <TouchableOpacity onPress={onBack} style={styles.footerLink}>
        <Text style={styles.footerLinkText}>Go back</Text>
      </TouchableOpacity>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 8 },

  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
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
  rolePillText: { color: theme.colors.accent, fontSize: 13, fontWeight: "700" },

  title: { color: theme.colors.white, fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: theme.colors.muted, fontSize: 14.5, lineHeight: 21, marginBottom: 26 },

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
  inputRowFocused: { borderColor: theme.colors.accent },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: theme.colors.white, fontSize: 15.5, padding: 0 },
  helper: { color: theme.colors.mutedDark, fontSize: 12, lineHeight: 18, marginTop: 2, marginBottom: 16 },

  card: {
    backgroundColor: theme.colors.input,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
    marginBottom: 4,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { color: theme.colors.white, fontWeight: "700", fontSize: 15.5 },
  cardSubtext: { color: theme.colors.mutedDark, fontSize: 12.5, lineHeight: 18, marginTop: 6 },

  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.muted, fontSize: 12, fontWeight: "600", marginHorizontal: 12 },

  footerLink: { marginTop: 18, alignSelf: "center" },
  footerLinkText: { color: theme.colors.muted, fontWeight: "700" },
});