import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBookingOptional } from '../../context/BookingContext';
import theme from '../theme';

const TONE = {
  info: { bg: 'rgba(255,184,0,0.14)', border: 'rgba(255,184,0,0.35)', color: '#ffb42f', icon: 'cash-outline' },
  success: { bg: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.35)', color: '#41c76b', icon: 'checkmark-circle' },
  accepted: { bg: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.35)', color: '#41c76b', icon: 'checkmark-circle' },
  error: { bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.35)', color: '#ef4444', icon: 'alert-circle' },
  cancelled: { bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.35)', color: '#ef4444', icon: 'close-circle' },
};

export default function BookingToast({ visible = true }) {
  const ctx = useBookingOptional();
  const notification = ctx?.notification;

  useEffect(() => {
    if (!notification) return undefined;
    const id = setTimeout(() => ctx?.clearNotification?.(), 6000);
    return () => clearTimeout(id);
  }, [notification, ctx?.clearNotification]);

  if (!visible || !notification) return null;
  const tone = TONE[notification.type] || TONE.info;

  return (
    <View style={[styles.wrap, { backgroundColor: tone.bg, borderColor: tone.border }]} pointerEvents="box-none">
      <TouchableOpacity style={styles.inner} activeOpacity={0.95} onPress={() => ctx?.clearNotification?.()}>
        <Ionicons name={tone.icon} size={16} color={tone.color} />
        <View style={styles.textWrap}>
          <Text style={styles.title}>{notification.title}</Text>
          {!!notification.message && (
            <Text style={styles.message} numberOfLines={2}>
              {notification.message}
            </Text>
          )}
        </View>
        <Ionicons name="close" size={14} color={theme.colors.muted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    ...theme.elevation.md,
    zIndex: 50,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  textWrap: { flex: 1 },
  title: { color: theme.colors.white, fontWeight: '800', fontSize: 12 },
  message: { color: theme.colors.muted, fontSize: 11, marginTop: 2 },
});
