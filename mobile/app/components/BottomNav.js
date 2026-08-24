import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

const CUSTOMER_TABS = [
  { key: 'home', label: 'Home', icon: 'home', iconOff: 'home-outline' },
  { key: 'browse', label: 'Explore', icon: 'compass', iconOff: 'compass-outline' },
  { key: 'chat', label: 'Messages', icon: 'chatbubble', iconOff: 'chatbubble-outline' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet', iconOff: 'wallet-outline' },
  { key: 'profile', label: 'Profile', icon: 'person', iconOff: 'person-outline' },
];

const FUNDI_TABS = [
  { key: 'home', label: 'Home', icon: 'home', iconOff: 'home-outline' },
  { key: 'bookings', label: 'Jobs', icon: 'briefcase', iconOff: 'briefcase-outline' },
  { key: 'chat', label: 'Chats', icon: 'chatbubble', iconOff: 'chatbubble-outline' },
  { key: 'profile', label: 'Profile', icon: 'person', iconOff: 'person-outline' },
];

export default function BottomNav({ active, onNavigate, role = 'customer' }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const tabs = role === 'fundi' ? FUNDI_TABS : CUSTOMER_TABS;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const color = isActive ? theme.colors.accent : theme.colors.mutedDark;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            activeOpacity={0.84}
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
              {t(tab.label)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#050505',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    minWidth: 0,
  },
  iconWrap: {
    height: 28,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
  },
  label: {
    color: theme.colors.mutedDark,
    fontSize: 10,
    fontWeight: '700',
  },
  labelActive: {
    color: theme.colors.accent,
    fontWeight: '800',
  },
});
