import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import ScrollScreen from '../components/ScrollScreen';
import StarRating from '../components/StarRating';
import theme from '../theme';
import { formatUgx, initials } from '../utils/ratings';
import { useLanguage } from '../i18n/LanguageContext';

const MAX_COMMENT = 300;

export default function RateExperienceScreen({
  job = {},
  existingReview = null,
  onBack,
  onSubmit,
}) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [photos, setPhotos] = useState(existingReview?.photoUrls || []);
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);
  const ctaScale = useRef(new Animated.Value(1)).current;
  const { t } = useLanguage();

  const fundiName = job.fundiName || 'Fundi';
  const firstName = fundiName.split(' ')[0];
  const releasedTime = job.releasedAt
    ? new Date(job.releasedAt).toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit' })
    : '8:41 PM';

  const pickPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('Permission needed'), t('Allow photo access to attach images.'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 3 - photos.length,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 3));
    }
  };

  const removePhoto = (uri) => setPhotos((prev) => prev.filter((p) => p !== uri));

  const handleSubmit = async () => {
    if (rating < 1) {
      Alert.alert(t('Rating required'), t('Pick a star rating before submitting.'));
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit?.({
        rating,
        comment: comment.trim(),
        photoUrls: photos,
        reviewId: existingReview?.reviewId || existingReview?._id || existingReview?.id,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const pressIn = () =>
    Animated.spring(ctaScale, { toValue: 0.97, friction: 8, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(ctaScale, { toValue: 1, friction: 8, useNativeDriver: true }).start();

  const ctaReady = rating >= 1;

  return (
    <ScrollScreen keyboard contentStyle={styles.scroll} bottomPad={40}>
      <TouchableOpacity style={styles.backRow} onPress={onBack} activeOpacity={0.7}>
        <View style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.white} />
        </View>
        <Text style={styles.backText}>{t('Rate your experience')}</Text>
      </TouchableOpacity>

      {/* Hero card */}
      <LinearGradient
        colors={['#2A1E07', '#161616']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroGlow} />
        <LinearGradient
          colors={[theme.colors.accentLight, theme.colors.accentDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarRing}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(fundiName)}</Text>
          </View>
        </LinearGradient>

        <View style={styles.heroInfo}>
          <Text style={styles.name}>{fundiName}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="checkmark-circle" size={14} color={theme.colors.green} />
            <Text style={styles.meta}>
              {job.service} · {t('Completed')}
            </Text>
          </View>
        </View>

        <View style={styles.releasedPill}>
          <Ionicons name="cash-outline" size={14} color={theme.colors.green} />
          <Text style={styles.releasedText}>{t('Released')}</Text>
        </View>
      </LinearGradient>

      <Text style={styles.releasedLine}>
        {t('{{amount}} released to {{firstName}} · {{time}}', {
          amount: formatUgx(job.amount),
          firstName,
          time: releasedTime,
        })}
      </Text>

      {/* Rating */}
      <View style={styles.ratingCard}>
        <Text style={styles.question}>
          {t('How was your experience with {{firstName}}?', { firstName })}
        </Text>
        <StarRating value={rating} onChange={setRating} size={44} />
      </View>

      {/* Comment */}
      <Text style={styles.fieldLabel}>{t('Tell others about your experience')}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          style={styles.input}
          multiline
          placeholder={t("What went well? Anything that could've been better?")}
          placeholderTextColor={theme.colors.mutedDark}
          value={comment}
          onChangeText={(val) => setComment(val.slice(0, MAX_COMMENT))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={MAX_COMMENT}
          selectionColor={theme.colors.accent}
        />
        <Text style={styles.counter}>
          {comment.length}/{MAX_COMMENT}
        </Text>
      </View>

      {/* Photos */}
      <Text style={styles.fieldLabel}>{t('Add photos (optional)')}</Text>
      <View style={styles.photoRow}>
        {photos.map((uri) => (
          <View key={uri} style={styles.photoWrap}>
            <Image source={{ uri }} style={styles.photo} />
            <TouchableOpacity
              style={styles.photoRemove}
              onPress={() => removePhoto(uri)}
              hitSlop={6}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={14} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < 3 ? (
          <TouchableOpacity style={styles.addTile} onPress={pickPhotos} activeOpacity={0.8}>
            <Ionicons name="camera-outline" size={22} color={theme.colors.accent} />
            <Text style={styles.addTileText}>{t('Upload photos')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Submit */}
      {submitting ? (
        <ActivityIndicator color={theme.colors.accent} style={styles.submitLoader} />
      ) : (
        <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
          <LinearGradient
            colors={
              ctaReady
                ? [theme.colors.accentLight, theme.colors.accentDark]
                : [theme.colors.input, theme.colors.input]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGrad}
          >
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={!ctaReady}
              activeOpacity={0.9}
            >
              <Ionicons
                name={existingReview ? 'create-outline' : 'star'}
                size={18}
                color={ctaReady ? theme.colors.textDark : theme.colors.mutedDark}
              />
              <Text style={[styles.submitText, !ctaReady && styles.submitTextDisabled]}>
                {existingReview ? t('Update review') : t('Submit review')}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={ctaReady ? theme.colors.textDark : theme.colors.mutedDark}
              />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 4 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: { color: theme.colors.white, fontWeight: '700', fontSize: 15 },

  hero: {
    borderRadius: theme.radius.xl,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
    ...theme.elevation.md,
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,184,0,0.08)',
    top: -70,
    right: -50,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    ...theme.elevation.sm,
  },
  avatar: {
    flex: 1,
    borderRadius: 33,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: theme.colors.white, fontWeight: '900', fontSize: 22 },
  heroInfo: { flex: 1, gap: 4 },
  name: { color: theme.colors.white, fontWeight: '800', fontSize: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { color: theme.colors.muted, fontSize: 13 },
  releasedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    gap: 4,
  },
  releasedText: { color: theme.colors.green, fontWeight: '700', fontSize: 11 },
  releasedLine: {
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },

  ratingCard: {
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  question: {
    color: theme.colors.white,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 24,
  },

  fieldLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.caps,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 10,
  },
  inputWrap: {
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    padding: 14,
    minHeight: 128,
  },
  inputWrapFocused: { borderColor: theme.colors.accent },
  input: {
    color: theme.colors.white,
    fontSize: 14,
    lineHeight: 21,
    textAlignVertical: 'top',
    minHeight: 92,
  },
  counter: {
    alignSelf: 'flex-end',
    color: theme.colors.mutedDark,
    fontSize: 11,
    marginTop: 6,
  },

  photoRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  photoWrap: { position: 'relative' },
  photo: {
    width: 84,
    height: 84,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.red,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  addTile: {
    width: 84,
    height: 84,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,184,0,0.5)',
    backgroundColor: 'rgba(255,184,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  addTileText: { color: theme.colors.accent, fontSize: 11, fontWeight: '600' },

  submitGrad: {
    marginTop: 28,
    borderRadius: theme.buttons.radius.lg,
    ...theme.elevation.lg,
  },
  submitBtn: {
    height: theme.buttons.height.lg,
    borderRadius: theme.buttons.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitText: {
    color: theme.colors.textDark,
    fontWeight: '800',
    fontSize: theme.buttons.fontSize.lg,
  },
  submitTextDisabled: { color: theme.colors.mutedDark },
  submitLoader: { marginTop: 32 },
});
