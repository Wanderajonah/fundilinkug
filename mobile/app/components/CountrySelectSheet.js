import React, { useEffect, useRef } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export const COUNTRIES = [
  { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
  { code: 'BI', name: 'Burundi', dial: '+257', flag: '🇧🇮' },
  { code: 'SS', name: 'South Sudan', dial: '+211', flag: '🇸🇸' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export default function CountrySelectSheet({ visible, selected, onSelect, onClose }) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(600);
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16), transform: [{ translateY }] },
          ]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{t('Select country')}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {COUNTRIES.map((country) => {
              const active = country.code === selected?.code;
              return (
                <TouchableOpacity
                  key={country.code}
                  style={styles.row}
                  activeOpacity={0.7}
                  onPress={() => onSelect(country)}
                >
                  <Text style={styles.flag}>{country.flag}</Text>
                  <Text style={[styles.name, active && styles.nameActive]}>{country.name}</Text>
                  <Text style={styles.dial}>{country.dial}</Text>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.accent} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    maxHeight: '65%',
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: theme.colors.border,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.borderLight,
    marginBottom: 14,
  },
  title: {
    color: theme.colors.white,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  flag: { fontSize: 20, marginRight: 12 },
  name: {
    flex: 1,
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  nameActive: { color: theme.colors.accent },
  dial: { color: theme.colors.muted, fontSize: 15, marginRight: 10 },
});
