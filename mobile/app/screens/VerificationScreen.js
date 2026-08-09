import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import theme from '../theme';
import ScreenWrapper from '../components/ScreenWrapper';
import { getProfile, requestVerification } from '../../services/usersApi';
import { resolveMediaUrl } from '../../utils/image';
import { useLanguage } from '../i18n/LanguageContext';

const STATUS_MAP = {
  unverified: { label: 'Not Verified', color: theme.colors.mutedDark, icon: 'shield-checkmark-outline' },
  pending: { label: 'Verification Pending', color: theme.colors.accent, icon: 'time-outline' },
  verified: { label: 'Verified', color: theme.colors.green, icon: 'shield-checkmark' },
  rejected: { label: 'Rejected', color: theme.colors.red, icon: 'shield-outline' },
};

const EXT_TO_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

const documentUpload = (asset) => {
  const name = asset.name || `verification-${Date.now()}.jpg`;
  const ext = String(name.split('.').pop() || '').toLowerCase();
  return {
    uri: asset.uri,
    name,
    type: asset.mimeType || EXT_TO_MIME[ext] || 'application/octet-stream',
  };
};

export default function VerificationScreen({ onNavigate }) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);

  const fundiProfile = profile?.fundiProfile || {};
  const status = fundiProfile.verificationStatus || 'unverified';
  const statusInfo = STATUS_MAP[status] || STATUS_MAP.unverified;
  const docs = fundiProfile.verificationDocs || [];

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data } = await getProfile();
      setProfile(data);
    } catch {
      Alert.alert(t('Error'), t('Could not load profile'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const pickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      setSelectedDocs((prev) => {
        const existing = new Set(prev.map((d) => d.uri || d.name));
        const newDocs = result.assets.filter((d) => !existing.has(d.uri || d.name));
        return [...prev, ...newDocs].slice(0, 5);
      });
    } catch {
      Alert.alert(t('Error'), t('Could not pick documents.'));
    }
  };

  const removeDoc = (doc) => {
    setSelectedDocs((prev) => prev.filter((d) => (d.uri || d.name) !== (doc.uri || doc.name)));
  };

  const handleSubmit = async () => {
    if (selectedDocs.length === 0) {
      Alert.alert(t('Documents required'), t('Please upload at least one document (e.g., ID, business license).'));
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      for (const asset of selectedDocs) {
        formData.append('documents', documentUpload(asset));
      }
      const { data } = await requestVerification(formData);
      setProfile((prev) => ({ ...prev, fundiProfile: data.fundiProfile }));
      setSelectedDocs([]);
      Alert.alert(t('Submitted'), t('Your verification request has been submitted for review.'));
    } catch (e) {
      Alert.alert(t('Error'), e?.response?.data?.message || t('Could not submit request.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onNavigate?.('profile')} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('Verification')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.accent} size="large" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.statusCard}>
              <Ionicons name={statusInfo.icon} size={40} color={statusInfo.color} />
              <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{t(statusInfo.label)}</Text>
              {status === 'verified' && (
                <Text style={styles.statusSub}>{t('Your identity has been verified. Clients can trust you with confidence.')}</Text>
              )}
              {status === 'pending' && (
                <Text style={styles.statusSub}>{t('Your documents are being reviewed. This usually takes 1-2 business days.')}</Text>
              )}
              {status === 'rejected' && (
                <Text style={styles.statusSub}>
                  {fundiProfile.verificationNotes || t('Your verification was rejected. Please submit new documents.')}
                </Text>
              )}
              {status === 'unverified' && (
                <Text style={styles.statusSub}>{t('Verify your identity to build trust with clients and get more bookings.')}</Text>
              )}
            </View>

            {(status === 'unverified' || status === 'rejected') && (
              <>
                <Text style={styles.sectionTitle}>{t('Upload Documents')}</Text>
                <Text style={styles.hint}>
                  {t('Upload a photo or PDF of your national ID, business license, or any official document')}
                </Text>

                <TouchableOpacity style={styles.uploadBtn} onPress={pickDocuments} activeOpacity={0.85}>
                  <Ionicons name="document-attach-outline" size={20} color={theme.colors.textDark} />
                  <Text style={styles.uploadText}>{t('Select Images or PDF')}</Text>
                </TouchableOpacity>

                {selectedDocs.length > 0 && (
                  <View style={styles.docsPreview}>
                    {selectedDocs.map((doc, idx) => {
                      const isPdf = doc.mimeType === 'application/pdf' || doc.name?.endsWith('.pdf');
                      return (
                        <View key={doc.uri || doc.name || idx} style={styles.docItem}>
                          {isPdf ? (
                            <View style={[styles.docThumb, styles.pdfIcon]}>
                              <Ionicons name="document-text" size={22} color={theme.colors.accent} />
                            </View>
                          ) : (
                            <Image source={{ uri: doc.uri }} style={styles.docThumb} />
                          )}
                          <Text style={styles.docName} numberOfLines={1}>{doc.name || t('Document {{num}}', { num: idx + 1 })}</Text>
                          <TouchableOpacity onPress={() => removeDoc(doc)}>
                            <Ionicons name="close-circle" size={20} color={theme.colors.red} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.submitBtn, (!selectedDocs.length || submitting) && { opacity: 0.5 }]}
                  onPress={handleSubmit}
                  disabled={!selectedDocs.length || submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator color={theme.colors.textDark} size="small" />
                  ) : (
                    <Text style={styles.submitText}>{t('Submit for Review')}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {status === 'pending' && docs.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t('Submitted Documents')}</Text>
                <View style={styles.docsPreview}>
                  {docs.map((url, idx) => (
                    <Image key={`${url}-${idx}`} source={{ uri: resolveMediaUrl(url) }} style={styles.submittedDoc} />
                  ))}
                </View>
              </>
            )}

            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={18} color={theme.colors.accent} />
              <Text style={styles.infoText}>
                {t('Verification helps clients trust your profile. Verified fundis appear higher in search results. You can upload images or PDF documents.')}
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: theme.colors.white, fontSize: 20, fontWeight: '800' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  statusCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 24,
    marginBottom: 20,
    gap: 12,
  },
  statusLabel: { fontSize: 18, fontWeight: '900' },
  statusSub: { color: theme.colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 18 },

  sectionTitle: { color: theme.colors.white, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  hint: { color: theme.colors.mutedDark, fontSize: 12, marginBottom: 14, lineHeight: 16 },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.accent,
    height: 52,
    borderRadius: theme.radius.pill,
    marginBottom: 16,
  },
  uploadText: { color: theme.colors.textDark, fontWeight: '800', fontSize: 15 },

  docsPreview: { gap: 8, marginBottom: 16 },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  docThumb: { width: 40, height: 40, borderRadius: 8 },
  pdfIcon: { backgroundColor: theme.colors.accentDim, justifyContent: 'center', alignItems: 'center' },
  docName: { flex: 1, color: theme.colors.white, fontSize: 13 },

  submitBtn: {
    backgroundColor: theme.colors.accent,
    height: 52,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  submitText: { color: theme.colors.textDark, fontWeight: '800', fontSize: 16 },

  submittedDoc: { width: '100%', height: 160, borderRadius: theme.radius.md, marginBottom: 8 },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: theme.colors.accentDim,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.2)',
    marginBottom: 20,
  },
  infoText: { color: theme.colors.muted, fontSize: 12, lineHeight: 17, flex: 1 },
});
