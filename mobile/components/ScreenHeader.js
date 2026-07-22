import React from "react";
import { Text } from "react-native";

export default function ScreenHeader({ title, subtitle, styles }) {
  return (
    <>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </>
  );
}
