import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScrollScreen from '../components/ScrollScreen';
import PrimaryButton from '../components/PrimaryButton';
import theme from '../theme';
import { updateProfile } from '../../services/usersApi';

const SKILL_OPTIONS = ['plumbing', 'electrical', 'carpentry', 'masonry', 'painting', 'cleaning'];

export default function FundiProfileSetupScreen({ onBack, onComplete, authToken }) {
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSave = async () => {
    if (skills.length === 0) {
      Alert.alert('Skills required', 'Select at least one skill.');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        skills,
        experience: Number(experience) || 0,
        bio,
        onboardingComplete: true,
      });
      onComplete?.();
    } catch (error) {
      Alert.alert('Could not save profile', error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollScreen keyboard contentStyle={styles.scroll} bottomPad={32}>
      <TouchableOpacity style={styles.backRow} onPress={onBack}>
        <Ionicons name="chevron-back" size={20} color={theme.colors.white} />
      </TouchableOpacity>

      <Text style={styles.title}>Set up your Fundi profile</Text>
      <Text style={styles.subtitle}>
        Tell clients what you do best. You can update this later.
      </Text>

      <Text style={styles.label}>Your skills</Text>
      <View style={styles.skillRow}>
        {SKILL_OPTIONS.map((s) => {
          const on = skills.includes(s);
          return (
            <TouchableOpacity
              key={s}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => toggleSkill(s)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Years of experience</Text>
      <TextInput
        style={styles.input}
        value={experience}
        onChangeText={setExperience}
        keyboardType="number-pad"
        placeholder="e.g. 5"
        placeholderTextColor={theme.colors.mutedDark}
      />

      <Text style={styles.label}>Short bio (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={bio}
        onChangeText={setBio}
        multiline
        placeholder="Describe your expertise..."
        placeholderTextColor={theme.colors.mutedDark}
      />

      <PrimaryButton onPress={handleSave} disabled={loading}>
        {loading ? 'Saving…' : 'Continue to dashboard '}
      </PrimaryButton>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 4 },
  backRow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { color: theme.colors.white, fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: theme.colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 24 },
  label: {
    color: theme.colors.muted,
    fontSize: theme.typography.caps,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 8,
  },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.muted, fontWeight: '700', fontSize: 13 },
  chipTextOn: { color: theme.colors.textDark },
  input: {
    backgroundColor: theme.colors.input,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.colors.white,
    fontSize: 16,
    marginBottom: 8,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
});
