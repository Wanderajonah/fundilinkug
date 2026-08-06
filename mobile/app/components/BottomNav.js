import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import theme from "../theme";

const TABS = [
  { key: "home", label: "Home", icon: "home", iconOff: "home-outline" },
  { key: "browse", label: "Explore", icon: "compass", iconOff: "compass-outline" },
  { key: "chat", label: "Messages", icon: "chatbubble", iconOff: "chatbubble-outline" },
  { key: "wallet", label: "Wallet", icon: "wallet", iconOff: "wallet-outline" },
  { key: "profile", label: "Profile", icon: "person", iconOff: "person-outline" },
];

export default function BottomNav({ active, onNavigate }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        const color = isActive ? theme.colors.accent : theme.colors.mutedDark;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => onNavigate?.(tab.key)}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Ionicons
                name={isActive ? tab.icon : tab.iconOff}
                size={22}
                color={color}
              />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.black,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  iconWrap: {
    height: 30,
    justifyContent: "center",
  },
  iconWrapActive: {
    borderRadius: 14,
    backgroundColor: "rgba(255,184,0,0.12)",
    paddingHorizontal: 12,
  },
  label: {
    color: theme.colors.mutedDark,
    fontSize: 10,
    fontWeight: "700",
  },
  labelActive: {
    color: theme.colors.accent,
  },
});
