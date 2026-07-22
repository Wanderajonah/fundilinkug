import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../theme';
import { formatCountdown, getTimeLeftSeconds } from '../utils/bookings';

export default function CountdownTimer({
  expiresAt,
  initialSeconds,
  onExpire,
  label = 'Time remaining',
  urgentAt = 60,
}) {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, initialSeconds ?? getTimeLeftSeconds({ expiresAt }) ?? 0)
  );

  useEffect(() => {
    setSeconds(Math.max(0, initialSeconds ?? getTimeLeftSeconds({ expiresAt }) ?? 0));
  }, [expiresAt, initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) {
      onExpire?.();
      return undefined;
    }
    const t = setInterval(() => {
      setSeconds((prev) => {
        const next = expiresAt
          ? Math.max(0, getTimeLeftSeconds({ expiresAt }))
          : Math.max(0, prev - 1);
        if (next <= 0) onExpire?.();
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [seconds, expiresAt, onExpire]);

  const urgent = seconds <= urgentAt;

  return (
    <View style={[styles.wrap, urgent && styles.urgent]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.time, urgent && styles.timeUrgent]}>{formatCountdown(seconds)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.lg,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  urgent: {
    borderColor: 'rgba(239,68,68,0.45)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  label: { color: theme.colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  time: { color: theme.colors.accent, fontSize: 36, fontWeight: '900', letterSpacing: 2 },
  timeUrgent: { color: theme.colors.red },
});
