import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';


export default function LocationPermissionDialog({
  visible,
  loading = false,
  onEnable,
  onCancel,
}) {
  const { t } = useLanguage();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="location-outline" size={32} color={theme.colors.accent} />
          </View>

          <Text style={styles.title}>{t('Location required')}</Text>
          <Text style={styles.message}>
            {t('Location access is required to find nearby Fundis and provide location-based services.')}
          </Text>


          {loading ? (
            <ActivityIndicator color={theme.colors.accent} style={{ marginVertical: 16 }} />
          ) : (
            <>
              <View style={styles.dialogBtns}>
                <PrimaryButton variant="primary" onPress={onEnable}>
                  {t('Enable Location')}
                </PrimaryButton>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.85}>
                  <Text style={styles.cancelText}>{t('Cancel')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: theme.colors.panel,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(34,197,94,0.15)',
    alignSelf: 'center',
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
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogBtns: { alignSelf: 'stretch', marginHorizontal: 24 },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: theme.colors.muted, fontWeight: '700', fontSize: 15 },
});
