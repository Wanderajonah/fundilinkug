import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import ScreenWrapper from '../components/ScreenWrapper';
import { useLanguage } from '../i18n/LanguageContext';

export default function RolePickerScreen({ user, onSelect }) {
  const { t } = useLanguage();

  return (
    <ScreenWrapper style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('Choose your account')}</Text>
        <Text style={styles.sub}>{t('This phone has multiple accounts. Which one would you like to use?')}</Text>
      </View>

      <View style={styles.list}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => onSelect('customer')}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="person" size={28} color={theme.colors.accent} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardName}>{user?.name || user?.firstName || 'User'}</Text>
            <Text style={styles.cardRole}>{t('Client')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedDark} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => onSelect('fundi')}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="briefcase" size={28} color={theme.colors.accent} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardName}>{user?.name || user?.firstName || 'User'}</Text>
            <Text style={styles.cardRole}>{t('Fundi')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedDark} />
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.black },
  header: { paddingTop: 20, paddingHorizontal: 24, marginBottom: 24 },
  title: { color: theme.colors.white, fontSize: 22, fontWeight: '900', marginBottom: 8 },
  sub: { color: theme.colors.mutedDark, fontSize: 14, lineHeight: 20 },
  list: { paddingHorizontal: 24, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,184,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardName: { color: theme.colors.white, fontSize: 16, fontWeight: '800' },
  cardRole: { color: theme.colors.mutedDark, fontSize: 13, marginTop: 2 },
});
