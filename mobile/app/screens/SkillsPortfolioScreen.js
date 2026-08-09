import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import theme from '../theme';
import ScreenWrapper from '../components/ScreenWrapper';
import { getProfile, uploadPortfolioImages, deletePortfolioImage } from '../../services/usersApi';
import { resolveMediaUrl } from '../../utils/image';
import { useLanguage } from '../i18n/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 8;
const COLS = 3;
const IMG_SIZE = (SCREEN_WIDTH - 40 - GAP * (COLS - 1)) / COLS;

export default function SkillsPortfolioScreen({ onNavigate }) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const user = profile?.user || {};
  const fundiProfile = profile?.fundiProfile || {};
  const skills = fundiProfile.skills || [];
  const portfolioImages = fundiProfile.portfolioImages || [];

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

  const addPhotos = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('Permission required'), t('Please allow access to your photos.'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.7,
      });
      if (result.canceled || !result.assets?.length) return;
      setUploading(true);
      try {
        const formData = new FormData();
        for (const asset of result.assets) {
          formData.append('images', {
            uri: asset.uri,
            type: asset.mimeType || 'image/jpeg',
            name: asset.fileName || `portfolio-${Date.now()}.jpg`,
          });
        }
        await uploadPortfolioImages(formData);
        await loadProfile();
      } catch {
        Alert.alert(t('Upload failed'), t('Could not upload images.'));
      } finally {
        setUploading(false);
      }
    } catch {
      Alert.alert(t('Error'), t('Could not open photo gallery.'));
    }
  };

  const removePhoto = (imageUrl) => {
    Alert.alert(t('Remove photo'), t('Remove this photo from your portfolio?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePortfolioImage(imageUrl);
            await loadProfile();
          } catch {
            Alert.alert(t('Error'), t('Could not remove photo.'));
          }
        },
      },
    ]);
  };

  return (
    <ScreenWrapper style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onNavigate?.('profile')} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('Skills & Portfolio')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.accent} size="large" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>{t('Skills')}</Text>
            {skills.length > 0 ? (
              <View style={styles.skillsRow}>
                {skills.map((s) => (
                  <View key={s} style={styles.skillChip}>
                    <Text style={styles.skillText}>{s}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>{t('No skills added yet')}</Text>
            )}

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>{t('Portfolio')}</Text>
            <Text style={styles.hint}>{t('Showcase your recent work to attract more clients')}</Text>

            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={addPhotos}
              disabled={uploading}
              activeOpacity={0.85}
            >
              {uploading ? (
                <ActivityIndicator color={theme.colors.textDark} size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color={theme.colors.textDark} />
                  <Text style={styles.uploadText}>{t('Add Photos')}</Text>
                </>
              )}
            </TouchableOpacity>

            {portfolioImages.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={40} color={theme.colors.mutedDark} />
                <Text style={styles.emptyTitle}>{t('No photos yet')}</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {portfolioImages.map((url, idx) => (
                  <TouchableOpacity
                    key={`${url}-${idx}`}
                    style={styles.imgWrap}
                    onPress={() => removePhoto(url)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: resolveMediaUrl(url) }} style={styles.img} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.input, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  title: { color: theme.colors.white, fontSize: 20, fontWeight: '800' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  sectionLabel: { color: theme.colors.white, fontWeight: '800', fontSize: 15, marginBottom: 10 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    backgroundColor: theme.colors.accentDim,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.2)',
  },
  skillText: { color: theme.colors.accent, fontWeight: '700', fontSize: 13 },
  emptyText: { color: theme.colors.mutedDark, fontSize: 13, fontStyle: 'italic' },

  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 20 },

  hint: { color: theme.colors.mutedDark, fontSize: 12, marginBottom: 14, marginTop: -4 },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.accent,
    paddingVertical: 13,
    borderRadius: 14,
    marginBottom: 16,
  },
  uploadText: { color: theme.colors.textDark, fontWeight: '800', fontSize: 15 },

  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyTitle: { color: theme.colors.mutedDark, fontSize: 14, fontWeight: '600' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  imgWrap: { width: IMG_SIZE, height: IMG_SIZE, borderRadius: 12, overflow: 'hidden' },
  img: { width: IMG_SIZE, height: IMG_SIZE },
});
