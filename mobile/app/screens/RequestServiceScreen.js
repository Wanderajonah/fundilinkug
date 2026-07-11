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
import ScreenWrapper from '../components/ScreenWrapper';

export default function RequestServiceScreen({
  artisan = {},
  authToken,
  onNavigate,
  onSessionRestored,
}) {
  const { address, coords } = useLocation();
  const [service, setService] = useState(artisan.skills?.[0] || artisan.role || 'General Service');
  const [date, setDate] = useState('Today');
  const [time, setTime] = useState('ASAP');
  const [location, setLocation] = useState(address || '');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    if (address) setLocation(address);
  }, [address]);

  const handleBook = async () => {
    if (!desc.trim()) {
      setError('Please describe the issue or service needed.');
      return;
    }
    if (!location.trim()) {
      setError('Please set your location before booking.');
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
      Alert.alert('Sign in required', 'Please sign in to book a fundi.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Sign In', onPress: () => onNavigate?.('signIn') },
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
        setError('Failed to upload photos. Please try again.');
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
      onNavigate?.('bookingSubmitted', {
        booking: {
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
        },
      });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickPhoto = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to your photo library to add photos.');
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
        <TouchableOpacity onPress={() => onNavigate?.('artisan')} style={styles.backRow}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(artisan.name || 'U').slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.name}>{artisan.name || 'Nearby Fundi'}</Text>
            <Text style={styles.role}>{artisan.role || service}</Text>
            <Text style={styles.meta}>★ {artisan.rating?.toFixed?.(1) || artisan.rating || '—'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Service Details</Text>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Service Type</Text>
          <View style={styles.fieldSelect}>
            <Text style={styles.fieldText}>{service}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Date</Text>
            <View style={styles.fieldInput}>
              <Text style={styles.fieldText}>{date}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Time</Text>
            <View style={styles.fieldInput}>
              <Text style={styles.fieldText}>{time}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Location</Text>
        <TouchableOpacity style={styles.fieldInput} onPress={() => onNavigate?.('setLocation')}>
          <Text style={styles.fieldText}>{location || 'Set location'}</Text>
        </TouchableOpacity>

        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Description</Text>
        <TextInput
          value={desc}
          onChangeText={setDesc}
          placeholder="Describe the issue..."
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={styles.textArea}
          multiline
        />

        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
          Photos (optional) <Text style={{ color: 'rgba(255,255,255,0.35)', fontWeight: '400' }}>— show the fundi what needs to be done</Text>
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
          <TouchableOpacity style={styles.photoPickerBtn} onPress={handlePickPhoto}>
            <Ionicons name="images-outline" size={20} color={theme.colors.mutedDark} style={{ marginRight: 8 }} />
            <Text style={styles.photoPickerText}>Add photos</Text>
          </TouchableOpacity>
        )}

        {uploadingPhotos ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
            <ActivityIndicator size="small" color={theme.colors.accent} />
            <Text style={{ color: theme.colors.muted, fontSize: 12 }}>Uploading photos…</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          style={{ marginTop: 18, borderRadius: 22, paddingVertical: 14 }}
          onPress={handleBook}
          disabled={submitting}
        >
          {submitting ? 'Sending request…' : 'Book Fundi'}
        </PrimaryButton>

        {submitting ? <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 12 }} /> : null}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  container: { paddingHorizontal: 16, paddingBottom: 120 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 6 },
  backArrow: { color: '#F3F3F3', fontSize: 22, marginRight: 8 },
  backText: { color: 'rgba(255,255,255,0.65)', fontWeight: '800' },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginTop: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245,158,11,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#F3F3F3', fontWeight: '900' },
  name: { color: '#F3F3F3', fontWeight: '900' },
  role: { color: 'rgba(255,255,255,0.6)' },
  meta: { color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  sectionTitle: { color: '#F3F3F3', fontWeight: '900', marginTop: 14, marginBottom: 8 },
  fieldRow: { marginBottom: 8 },
  fieldLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 6 },
  fieldSelect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  fieldText: { color: '#F3F3F3' },
  fieldInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  textArea: {
    minHeight: 90,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 10,
    color: '#F3F3F3',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  photoPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginTop: 6,
  },
  photoPickerText: { color: theme.colors.mutedDark, fontSize: 13 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  photoThumbWrap: { position: 'relative' },
  photoThumb: { width: 64, height: 64, borderRadius: 8 },
  photoRemove: { position: 'absolute', top: -6, right: -6 },
  photoAdd: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  errorText: { color: theme.colors.red, fontSize: 13 },
});
