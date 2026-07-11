import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ScrollScreen from '../components/ScrollScreen';
import PrimaryButton from '../components/PrimaryButton';
import StarRating from '../components/StarRating';
import theme from '../theme';
import { formatUgx, initials } from '../utils/ratings';

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

  const fundiName = job.fundiName || 'Fundi';
  const firstName = fundiName.split(' ')[0];
  const releasedTime = job.releasedAt
    ? new Date(job.releasedAt).toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit' })
    : '8:41 PM';

  const pickPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach images.');
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
      Alert.alert('Rating required', 'Pick a star rating before submitting.');
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

  return (
    <ScrollScreen keyboard contentStyle={styles.scroll} bottomPad={32}>
      <TouchableOpacity style={styles.backRow} onPress={onBack}>
        <Ionicons name="chevron-back" size={20} color={theme.colors.white} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(fundiName)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{fundiName}</Text>
          <Text style={styles.meta}>
            {job.service} · Completed
          </Text>
        </View>
        <View style={styles.releasedBadge}>
          <Ionicons name="cash-outline" size={14} color={theme.colors.green} />
          <Text style={styles.releasedText}> Released</Text>
        </View>
      </View>

      <Text style={styles.releasedLine}>
        {formatUgx(job.amount)} released to {firstName} · {releasedTime}
      </Text>

      <Text style={styles.question}>How was your experience with {firstName}?</Text>
      <StarRating value={rating} onChange={setRating} />

      <Text style={styles.fieldLabel}>Tell others about your experience</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          multiline
          placeholder="What went well? Anything that could've been better?"
          placeholderTextColor={theme.colors.mutedDark}
          value={comment}
          onChangeText={(t) => setComment(t.slice(0, MAX_COMMENT))}
          maxLength={MAX_COMMENT}
        />
        <Text style={styles.counter}>
          {comment.length}/{MAX_COMMENT}
        </Text>
      </View>

      <Text style={styles.fieldLabel}>Add photos (optional)</Text>
      <TouchableOpacity style={styles.uploadBtn} onPress={pickPhotos} activeOpacity={0.85}>
        <Ionicons name="camera-outline" size={22} color={theme.colors.muted} />
        <Text style={styles.uploadText}>Upload photos</Text>
      </TouchableOpacity>

      {photos.length > 0 ? (
        <View style={styles.photoRow}>
          {photos.map((uri) => (
            <View key={uri} style={styles.photoWrap}>
              <Image source={{ uri }} style={styles.photo} />
              <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(uri)}>
                <Ionicons name="close" size={14} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      {submitting ? (
        <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 16 }} />
      ) : (
        <PrimaryButton
          onPress={handleSubmit}
          disabled={rating < 1}
          style={{ marginTop: 20 }}
        >
          {existingReview ? 'Update review' : 'Submit review'}
        </PrimaryButton>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 4 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 4 },
  backText: { color: theme.colors.white, fontWeight: '600', fontSize: 15 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.lg,
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,184,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: theme.colors.white, fontWeight: '800' },
  name: { color: theme.colors.white, fontWeight: '800', fontSize: 16 },
  meta: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
  releasedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34,197,94,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 2,
  },
  releasedText: { color: theme.colors.green, fontWeight: '700', fontSize: 11 },
  releasedLine: {
    color: theme.colors.muted,
    fontSize: 13,
    marginBottom: 24,
    textAlign: 'center',
  },
  question: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  fieldLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.caps,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 24,
    marginBottom: 10,
  },
  inputWrap: {
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    minHeight: 120,
  },
  input: {
    color: theme.colors.white,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
    minHeight: 88,
  },
  counter: {
    alignSelf: 'flex-end',
    color: theme.colors.mutedDark,
    fontSize: 11,
    marginTop: 4,
  },
  uploadBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.mutedDark,
    borderRadius: theme.radius.md,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  uploadText: { color: theme.colors.muted, fontWeight: '600' },
  photoRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  photoWrap: { position: 'relative' },
  photo: { width: 72, height: 72, borderRadius: 10 },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
