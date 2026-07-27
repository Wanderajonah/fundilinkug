import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../theme';
import { SupportChat } from '../screens/ChatScreen';

export default function FloatingSupportChat({ userId }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <TouchableOpacity
        style={[
          styles.fab,
          {
            right: 18,
            bottom: Math.max(insets.bottom, 10) + 86,
          },
        ]}
        activeOpacity={0.86}
        onPress={() => setOpen(true)}
      >
        <Ionicons name="headset" size={24} color={theme.colors.black} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View
            style={[
              styles.panel,
              {
                right: 12,
                top: Math.max(insets.top, 20) + 60,
                bottom: 12,
              },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.botIcon}>
                  <Ionicons name="sparkles" size={16} color={theme.colors.black} />
                </View>
                <Text style={styles.title}>FundiLink Support</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
                <Ionicons name="close" size={20} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
            <SupportChat userId={userId} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    zIndex: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    ...theme.elevation.md,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    position: 'absolute',
    width: '92%',
    maxWidth: 420,
    maxHeight: 640,
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    ...theme.elevation.lg,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: theme.colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: '#24343D',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  title: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  closeBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
