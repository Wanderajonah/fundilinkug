import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import { TAB_BAR_CONTENT_HEIGHT } from '../hooks/useTabBarHeight';
import { useLanguage } from '../i18n/LanguageContext';

const CUSTOMER_TABS = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'browse', label: 'Browse', icon: 'search-outline', activeIcon: 'search' },
  { key: 'bookings', label: 'Bookings', icon: 'calendar-outline', activeIcon: 'calendar' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

const FUNDI_TABS = [
  { key: 'fundiDashboard', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'bookings', label: 'Jobs', icon: 'briefcase-outline', activeIcon: 'briefcase' },
  { key: 'chat', label: 'Messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export default function BottomTabBar({ active, onTab, role = 'customer' }) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const tabs = role === 'fundi' ? FUNDI_TABS : CUSTOMER_TABS;

  return (
    <View style={[styles.bar, { paddingBottom: bottomPad, minHeight: TAB_BAR_CONTENT_HEIGHT + bottomPad }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.item}
            onPress={() => onTab?.(tab.key)}
            activeOpacity={0.85}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? theme.colors.textDark : theme.colors.mutedDark}
              />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{t(tab.label)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 8,
    backgroundColor: theme.colors.black,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
    paddingTop: 4,
  },
  iconWrap: {
    width: 40,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: theme.colors.accent,
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.mutedDark,
  },
  labelActive: { color: theme.colors.accent, fontWeight: '800' },
});
