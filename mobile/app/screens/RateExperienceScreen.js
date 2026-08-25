import React, { useEffect, useRef, useState } from 'react';
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
  Dimensions,
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
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOOD_CHIPS = [
  { label: 'Professional', icon: 'briefcase-outline', minRating: 4 },
  { label: 'Friendly', icon: 'happy-outline', minRating: 3 },
  { label: 'Fast work', icon: 'flash-outline', minRating: 4 },
  { label: 'Great value', icon: 'cash-outline', minRating: 3 },
  { label: 'Clean work', icon: 'sparkles-outline', minRating: 4 },
  { label: 'On time', icon: 'time-outline', minRating: 3 },
];

function CelebrationParticle({ delay, x, color }) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(y, {
          toValue: -260 - Math.random() * 120,
          duration: 1800 + Math.random() * 600,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(800),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.spring(scale, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: x,
          backgroundColor: color,
          transform: [{ translateY: y }, { scale }],
          opacity,
        },
      ]}
    />
  );
}

function CheckmarkAnimation() {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.checkRing,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      <LinearGradient
        colors={[theme.colors.green, '#16A34A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.checkGrad}
      >
        <Ionicons name="checkmark" size={32} color="#fff" />
      </LinearGradient>
    </Animated.View>
  );
}

const PARTICLE_COLORS = [
  theme.colors.accent,
  theme.colors.accentLight,
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
];

export default function RateExperienceScreen({
  job = {},
  existingReview = null,
  reviewHistory = [],
  onBack,
  onSubmit,
  onSetEditingReview,
}) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [photos, setPhotos] = useState(existingReview?.photoUrls || []);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const ctaScale = useRef(new Animated.Value(1)).current;
  const heroScale = useRef(new Animated.Value(0.95)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const ratingCardScale = useRef(new Animated.Value(0.95)).current;
  const ratingCardOpacity = useRef(new Animated.Value(0)).current;
  const { t } = useLanguage();

  const fundiName = job.fundiName || 'Fundi';
  const firstName = fundiName.split(' ')[0];
  const releasedTime = job.releasedAt
    ? new Date(job.releasedAt).toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit' })
    : '';

  // Auto-detect existing review for the same fundi if not already provided
  useEffect(() => {
    if (existingReview || !onSetEditingReview) return;
    const fundiId = job.fundiId || job.fundi;
    if (!fundiId) return;
    const found = reviewHistory.find(
      (r) =>
        (r.fundiId === fundiId || r.fundi?._id === fundiId) &&
        r.reviewId &&
        !String(r.reviewId).startsWith('demo') &&
        !String(r.reviewId).startsWith('local-'),
    );
    if (found) onSetEditingReview(found);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync form when existingReview is set asynchronously (e.g. auto-detected)
  useEffect(() => {
    if (!existingReview) return;
    setRating(existingReview.rating || 0);
    setComment(existingReview.comment || '');
    setPhotos(existingReview.photoUrls || []);
  }, [existingReview?.reviewId || existingReview?._id || existingReview?.id]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heroScale, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(ratingCardScale, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(ratingCardOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

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

  const toggleMood = (label) => {
    setSelectedMoods((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label],
    );
  };

  const handleSubmit = async () => {
    if (rating < 1) {
      Alert.alert(t('Rating required'), t('Pick a star rating before submitting.'));
      return;
    }
    setSubmitting(true);
    try {
      const moodText = selectedMoods.length > 0 ? `\n\nHighlights: ${selectedMoods.join(', ')}` : '';
      await onSubmit?.({
        rating,
        comment: (comment.trim() + moodText).trim(),
        photoUrls: photos,
        reviewId: existingReview?.reviewId || existingReview?._id || existingReview?.id,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const pressIn = () =>
    Animated.spring(ctaScale, { toValue: 0.97, friction: 8, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(ctaScale, { toValue: 1, friction: 8, useNativeDriver: true }).start();

  const ctaReady = rating >= 1;

  if (submitted) {
    return (
      <ScrollScreen contentStyle={styles.scroll} bottomPad={40}>
        <View style={styles.successContainer}>
          {Array.from({ length: 16 }).map((_, i) => (
            <CelebrationParticle
              key={i}
              delay={i * 80}
              x={40 + Math.random() * (SCREEN_WIDTH - 80)}
              color={PARTICLE_COLORS[i % PARTICLE_COLORS.length]}
            />
          ))}
          <CheckmarkAnimation />
          <Text style={styles.successTitle}>{t('Thank you!')}</Text>
          <Text style={styles.successSub}>
            {existingReview
              ? t('Your review for {{name}} has been updated.', { name: firstName })
              : t('Your review for {{name}} has been submitted.', { name: firstName })}
          </Text>
          <TouchableOpacity style={styles.successBtn} onPress={onBack} activeOpacity={0.8}>
            <Text style={styles.successBtnText}>{t('Done')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen keyboard contentStyle={styles.scroll} bottomPad={40}>
      <TouchableOpacity style={styles.backRow} onPress={onBack} activeOpacity={0.7}>
        <View style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.white} />
        </View>
        <Text style={styles.backText}>
          {existingReview ? t('Edit your review') : t('Rate your experience')}
        </Text>
      </TouchableOpacity>

      {/* Celebration particles */}
      {rating >= 4 &&
        Array.from({ length: 8 }).map((_, i) => (
          <CelebrationParticle
            key={`p-${i}`}
            delay={i * 120}
            x={30 + Math.random() * (SCREEN_WIDTH - 60)}
            color={PARTICLE_COLORS[i % PARTICLE_COLORS.length]}
          />
        ))}

      {/* Hero card */}
      <Animated.View
        style={[
          styles.heroWrap,
          {
            transform: [{ scale: heroScale }],
            opacity: heroOpacity,
          },
        ]}
      >
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
            <Text style={styles.releasedText}>{t('Paid')}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <Text style={styles.releasedLine}>
        {t('{{amount}} released to {{firstName}}', {
          amount: formatUgx(job.amount),
          firstName,
        })}
        {releasedTime ? ` · ${releasedTime}` : ''}
      </Text>

      {/* Rating */}
      <Animated.View
        style={[
          styles.ratingCard,
          {
            transform: [{ scale: ratingCardScale }],
            opacity: ratingCardOpacity,
          },
        ]}
      >
        <Text style={styles.question}>
          {existingReview
            ? t('Update your review for {{firstName}}?', { firstName })
            : t('How was your experience with {{firstName}}?', { firstName })}
        </Text>
        <StarRating value={rating} onChange={setRating} size={48} />
      </Animated.View>

      {/* Mood chips */}
      <Text style={styles.sectionLabel}>{t('Quick tags')}</Text>
      <View style={styles.chipRow}>
        {MOOD_CHIPS.filter((c) => rating >= c.minRating || selectedMoods.includes(c.label)).map(
          (chip) => {
            const active = selectedMoods.includes(chip.label);
            return (
              <TouchableOpacity
                key={chip.label}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleMood(chip.label)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={chip.icon}
                  size={14}
                  color={active ? theme.colors.textDark : theme.colors.muted}
                />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {t(chip.label)}
                </Text>
              </TouchableOpacity>
            );
          },
        )}
      </View>

      {/* Comment */}
      <Text style={styles.sectionLabel}>{t('Your review')}</Text>
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
      <Text style={styles.sectionLabel}>{t('Add photos (optional)')}</Text>
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
            <Text style={styles.addTileText}>{t('Upload')}</Text>
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

  heroWrap: {},
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
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    ...theme.elevation.sm,
  },
  question: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 26,
  },

  sectionLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.caps,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 10,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  chipText: { color: theme.colors.muted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: theme.colors.textDark },

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

  /* Celebration particles */
  particle: {
    position: 'absolute',
    top: '45%',
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 10,
  },

  /* Success state */
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  checkRing: {
    marginBottom: 24,
  },
  checkGrad: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.elevation.lg,
  },
  successTitle: {
    color: theme.colors.white,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
  },
  successSub: {
    color: theme.colors.muted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    paddingHorizontal: 20,
  },
  successBtn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: theme.buttons.radius.lg,
    ...theme.elevation.md,
  },
  successBtnText: {
    color: theme.colors.textDark,
    fontWeight: '800',
    fontSize: 16,
  },
});
