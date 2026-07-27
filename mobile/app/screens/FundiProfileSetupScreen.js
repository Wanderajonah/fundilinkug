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
  const [customSkill, setCustomSkill] = useState('');
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim().toLowerCase();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      Alert.alert('Already added', `"${trimmed}" is already in your list.`);
      return;
    }
    setSkills((prev) => [...prev, trimmed]);
    setCustomSkill('');
  };

  const removeSkill = (skill) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleSave = async () => {
    if (skills.length === 0) {
      Alert.alert('Skills required', 'Select or type in at least one skill.');
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
        <Ionicons name="chevron-back" size={22} color={theme.colors.white} />
      </TouchableOpacity>

      <Text style={styles.title}>Set up your Fundi profile</Text>
      <Text style={styles.subtitle}>
        Tell clients what you do best. You can update this later.
      </Text>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="construct-outline" size={18} color={theme.colors.accent} />
          <Text style={styles.sectionTitle}>Your skills</Text>
        </View>

        <View style={styles.chipRow}>
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

        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            value={customSkill}
            onChangeText={setCustomSkill}
            placeholder="Add a skill not listed..."
            placeholderTextColor={theme.colors.mutedDark}
            onSubmitEditing={addCustomSkill}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addCustomSkill}>
            <Ionicons name="add" size={20} color={theme.colors.textDark} />
          </TouchableOpacity>
        </View>

        {skills.filter((s) => !SKILL_OPTIONS.includes(s)).length > 0 && (
          <View style={styles.customSkillsSection}>
            <Text style={styles.customSkillsLabel}>Custom skills</Text>
            <View style={styles.chipRow}>
              {skills
                .filter((s) => !SKILL_OPTIONS.includes(s))
                .map((s) => (
                  <View key={s} style={[styles.chip, styles.chipOn, styles.customChip]}>
                    <Text style={[styles.chipText, styles.chipTextOn]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                    <TouchableOpacity onPress={() => removeSkill(s)} style={styles.removeBtn}>
                      <Ionicons name="close-circle" size={16} color={theme.colors.textDark} />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="briefcase-outline" size={18} color={theme.colors.accent} />
          <Text style={styles.sectionTitle}>Years of experience</Text>
        </View>
        <TextInput
          style={styles.input}
          value={experience}
          onChangeText={setExperience}
          keyboardType="number-pad"
          placeholder="e.g. 5"
          placeholderTextColor={theme.colors.mutedDark}
          selectionColor={theme.colors.accent}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={18} color={theme.colors.accent} />
          <Text style={styles.sectionTitle}>Short bio (optional)</Text>
        </View>
        <TextInput
          style={[styles.input, styles.textArea, { color: '#FFFFFF' }]}
          value={bio}
          onChangeText={setBio}
          multiline
          placeholder="Describe your expertise..."
          placeholderTextColor={theme.colors.mutedDark}
          selectionColor={theme.colors.accent}
        />
      </View>

      <PrimaryButton onPress={handleSave} disabled={loading}>
        {loading ? 'Saving…' : 'Continue'}
      </PrimaryButton>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 4 },
  backRow: { marginBottom: 16 },
  title: { color: theme.colors.white, fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: theme.colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 24 },

  card: {
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '700',
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.muted, fontWeight: '700', fontSize: 13 },
  chipTextOn: { color: theme.colors.textDark },

  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  customInput: {
    flex: 1,
    backgroundColor: theme.colors.input,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: theme.colors.white,
    fontSize: 14,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customSkillsSection: { marginTop: 12 },
  customSkillsLabel: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  customChip: {
    backgroundColor: theme.colors.accentDim,
    borderColor: theme.colors.accent,
  },
  removeBtn: { marginLeft: 6 },

  input: {
    backgroundColor: theme.colors.input,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.colors.white,
    fontSize: 16,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
});
