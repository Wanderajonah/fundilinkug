import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../../context/LocationContext';
import {
  restoreAuthSession,
  hasApiAuthToken,
} from '../../services/authApi';
import { createBooking, uploadBookingImage, getErrorMessage } from '../../services/bookingsApi';
import { compressImage } from '../../utils/image';
import { normalizeCategory } from '../utils/bookings';
import theme from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import BookingSentAlert from '../components/BookingSentAlert';
import ScreenWrapper from '../components/ScreenWrapper';
import { useLanguage } from '../i18n/LanguageContext';

export default function RequestServiceScreen({
  artisan = {},
  authToken,
  onNavigate,
  onSessionRestored,
}) {
  const { address, coords } = useLocation();
  const { t } = useLanguage();
  const [service, setService] = useState(artisan.skills?.[0] || artisan.role || t('General Service'));
  const [date, setDate] = useState(t('Today'));
  const [time, setTime] = useState('ASAP');
  const [location, setLocation] = useState(address || '');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [sentAlertVisible, setSentAlertVisible] = useState(false);
  const [sentBooking, setSentBooking] = useState(null);

  useEffect(() => {
    if (address) setLocation(address);
  }, [address]);

  const handleBook = async () => {
    if (!desc.trim()) {
      setError(t('Please describe the issue or service needed.'));
      return;
    }
    if (!location.trim()) {
      setError(t('Please set your location before booking.'));
      return;
    }
    let canBook = Boolean(authToken || hasApiAuthToken());
    if (!canBook) {
      const session = await restoreAuthSession();
      if (session?.token) {
        onSessionRestored?.(session);
        canBook = true;
      }
    }

    if (!canBook) {
      Alert.alert(t('Sign in required'), t('Please sign in to book a fundi.'), [
        { text: t('Not now'), style: 'cancel' },
        { text: t('Sign In'), onPress: () => onNavigate?.('signIn') },
      ]);
      return;
    }

    setSubmitting(true);
    setError('');

    let imageUrls = [];
    if (photos.length > 0) {
      setUploadingPhotos(true);
      try {
        for (const uri of photos) {
          const compressed = await compressImage(uri);
          const formData = new FormData();
          const filename = compressed.split('/').pop() || 'photo.jpg';
          formData.append('image', { uri: compressed, type: 'image/jpeg', name: filename });
          const { data } = await uploadBookingImage(formData);
          if (data?.url) imageUrls.push(data.url);
        }
      } catch (uploadErr) {
        setUploadingPhotos(false);
        setSubmitting(false);
        setError(t('Failed to upload photos. Please try again.'));
        return;
      }
      setUploadingPhotos(false);
    }

    try {
      const category = normalizeCategory(service, artisan.skills || []);
      const { data } = await createBooking({
        category,
        description: desc.trim(),
        address: location.trim(),
        location: { lat: coords.lat, lng: coords.lng },
        estimatedDuration: 60,
        fundiId: artisan.id || artisan._id,
        images: imageUrls,
      });

      const booking = data.booking;
      setSentBooking({
        id: booking._id,
        _id: booking._id,
        status: booking.status,
        service: category,
        category,
        description: desc.trim(),
        address: location.trim(),
        location: booking.location,
        expiresAt: booking.expiresAt,
        date,
        time,
        artisanName: artisan.name,
      });
      setSentAlertVisible(true);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickPhoto = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('Permission needed'), t('Allow access to your photo library to add photos.'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 5 - photos.length,
    });
    if (result.canceled || !result.assets?.length) return;
    const newUris = result.assets.map((a) => a.uri).filter(Boolean);
    setPhotos((prev) => [...prev, ...newUris].slice(0, 5));
  }, [photos.length]);

  return (
    <ScreenWrapper style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => onNavigate?.('artisan')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.white} />
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(artisan.name || 'U').slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{artisan.name || t('Nearby Fundi')}</Text>
            <Text style={styles.role}>{artisan.role || service}</Text>
            <Text style={styles.meta}>★ {artisan.rating?.toFixed?.(1) || artisan.rating || '—'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('Service Details')}</Text>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{t('Service Type')}</Text>
          <View style={styles.fieldBox}>
            <Text style={styles.fieldText}>{service}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>{t('Date')}</Text>
            <View style={styles.fieldBox}>
              <Text style={styles.fieldText}>{date}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>{t('Time')}</Text>
            <View style={styles.fieldBox}>
              <Text style={styles.fieldText}>{time}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.fieldLabel}>{t('Location')}</Text>
        <TouchableOpacity style={styles.fieldBox} onPress={() => onNavigate?.('setLocation')}>
          <View style={styles.fieldRowInner}>
            <Ionicons name="location-outline" size={16} color={theme.colors.mutedDark} />
            <Text style={[styles.fieldText, !location && styles.placeholderText]}>
              {location || t('Set location')}
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>{t('Description')}</Text>
        <TextInput
          value={desc}
          onChangeText={setDesc}
          placeholder={t('Describe the issue...')}
          placeholderTextColor={theme.colors.mutedDark}
          style={styles.textArea}
          multiline
        />

        <Text style={styles.fieldLabel}>
          {t('Photos (optional)')}{' '}
          <Text style={styles.photosHint}>— {t('show the fundi what needs to be done')}</Text>
        </Text>

        {photos.length > 0 ? (
          <View style={styles.photoRow}>
            {photos.map((uri, i) => (
              <View key={i} style={styles.photoThumbWrap}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => setPhotos(photos.filter((_, j) => j !== i))}
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.red} />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 5 ? (
              <TouchableOpacity style={styles.photoAdd} onPress={handlePickPhoto}>
                <Ionicons name="camera-outline" size={22} color={theme.colors.mutedDark} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <TouchableOpacity style={styles.photoPickerBtn} onPress={handlePickPhoto} activeOpacity={0.85}>
            <Ionicons name="images-outline" size={18} color={theme.colors.accent} style={styles.photoPickerIcon} />
            <Text style={styles.photoPickerText}>{t('Add photos')}</Text>
          </TouchableOpacity>
        )}

        {uploadingPhotos ? (
          <View style={styles.uploadingRow}>
            <ActivityIndicator size="small" color={theme.colors.accent} />
            <Text style={styles.uploadingText}>{t('Uploading photos…')}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          onPress={handleBook}
          disabled={submitting}
          loading={submitting}
          icon="hammer-outline"
          style={styles.mainBtn}
        >
          {submitting ? t('Sending request…') : t('Book Fundi')}
        </PrimaryButton>
      </ScrollView>

      <BookingSentAlert
        visible={sentAlertVisible}
        onAutoClose={() => {
          setSentAlertVisible(false);
          onNavigate?.('bookingWaiting', { booking: sentBooking });
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  container: { paddingHorizontal: 20, paddingBottom: 120 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.input,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  headerInfo: { flex: 1, marginLeft: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: theme.colors.accent, fontWeight: '900', fontSize: 16 },
  name: { color: theme.colors.white, fontWeight: '900', fontSize: 16 },
  role: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
  meta: { color: theme.colors.accent, fontSize: 13, marginTop: 4, fontWeight: '700' },
  sectionTitle: {
    color: theme.colors.white,
    fontWeight: '800',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 12,
  },
  fieldRow: { marginBottom: 12 },
  twoCol: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  fieldLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.caps,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 12,
  },
  fieldBox: {
    backgroundColor: theme.colors.input,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fieldRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldText: { color: theme.colors.white, fontSize: 15 },
  placeholderText: { color: theme.colors.mutedDark },
  textArea: {
    minHeight: 100,
    backgroundColor: theme.colors.input,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.white,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  photosHint: { color: theme.colors.mutedDark, fontWeight: '400' },
  photoPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.input,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
  },
  photoPickerIcon: { marginRight: 0 },
  photoPickerText: { color: theme.colors.muted, fontSize: 14, fontWeight: '600' },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  photoThumbWrap: { position: 'relative' },
  photoThumb: { width: 64, height: 64, borderRadius: theme.radius.sm },
  photoRemove: { position: 'absolute', top: -6, right: -6 },
  photoAdd: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  uploadingText: { color: theme.colors.muted, fontSize: 13 },
  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  errorText: { color: theme.colors.red, fontSize: 13, lineHeight: 18 },
  mainBtn: { marginTop: 24 },
});
