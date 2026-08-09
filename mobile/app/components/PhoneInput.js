import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import CountrySelectSheet, { DEFAULT_COUNTRY } from './CountrySelectSheet';
import { useLanguage } from '../i18n/LanguageContext';

export default function PhoneInput({
  label = 'Phone number',
  value,
  onChangeText,
  placeholder = '7XX XXX XXX',
  focused,
  onFocus,
  onBlur,
  country = DEFAULT_COUNTRY,
  onCountryChange,
}) {
  const { t } = useLanguage();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(country);

  useEffect(() => {
    setSelectedCountry(country);
  }, [country]);

  const handleSelect = (next) => {
    setSheetOpen(false);
    setSelectedCountry(next);
    onCountryChange?.(next);
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{t(label)}</Text> : null}
      <View style={[styles.row, focused && styles.rowFocused]}>
        <TouchableOpacity
          style={styles.codeWrap}
          activeOpacity={0.7}
          onPress={() => setSheetOpen(true)}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={styles.codeNum}>{selectedCountry.dial}</Text>
          <Ionicons name="chevron-down" size={14} color={theme.colors.muted} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.mutedDark}
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
      <CountrySelectSheet
        visible={sheetOpen}
        selected={selectedCountry}
        onSelect={handleSelect}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    backgroundColor: theme.colors.input,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  rowFocused: { borderColor: theme.colors.accent, borderWidth: 0.5 },
  codeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingRight: 4,
  },
  flag: {
    fontSize: 17,
  },
  codeNum: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border,
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    color: theme.colors.white,
    fontSize: 15,
    paddingVertical: 0,
  },
});
