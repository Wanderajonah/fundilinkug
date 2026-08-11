import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export default function BookingSentAlert({ visible, onAutoClose }) {
  const { t } = useLanguage();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setFrame(0);
    const dotTimer = setInterval(() => setFrame((f) => (f + 1) % 3), 350);
    const closeTimer = setTimeout(() => onAutoClose?.(), 2200);
    return () => {
      clearInterval(dotTimer);
      clearTimeout(closeTimer);
    };
  }, [visible, onAutoClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onAutoClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={40} color={theme.colors.textDark} />
          </View>
          <Text style={styles.title}>{t('Booking Request Sent!')}</Text>
          <Text style={styles.message}>
            {t("We're notifying nearby fundis. You'll see live updates while we find someone for you.")}
          </Text>
          <View style={styles.dots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.dot, i === frame && styles.dotActive]} />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    backgroundColor: theme.colors.panel,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  checkCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 18,
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.borderLight,
  },
  dotActive: { backgroundColor: theme.colors.accent },
});
