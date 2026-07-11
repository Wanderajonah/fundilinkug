import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function RoleTabs({ tabs, activeRole, onSelect, styles }) {
  return (
    <View style={styles.row}>
      {tabs.map((role) => (
        <TouchableOpacity
          key={role}
          style={[styles.tab, activeRole === role && styles.tabActive]}
          onPress={() => onSelect(role)}
        >
          <Text style={styles.tabText}>{role}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
