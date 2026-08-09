import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

function MapErrorFallback({ style }) {
  const { t } = useLanguage();
  return (
    <View style={[styles.fallback, style]}>
      <Text style={styles.fallbackText}>{t('Map unavailable')}</Text>
    </View>
  );
}

export default class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <MapErrorFallback style={this.props.style} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: theme.colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.lg,
    minHeight: 180,
  },
  fallbackText: { color: theme.colors.muted, fontSize: 14 },
});
