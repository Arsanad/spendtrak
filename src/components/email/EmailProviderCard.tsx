// EmailProviderCard.tsx - Provider selection card with OAuth support
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmailProvider } from '@/config/emailProviders';
import { FontFamily, FontSize } from '@/design/cinematic';

interface EmailProviderCardProps {
  provider: EmailProvider;
  onSelect: () => void;
  isConnected?: boolean;
  isOAuth?: boolean;
  connectedCount?: number;
}

export const EmailProviderCard: React.FC<EmailProviderCardProps> = ({
  provider,
  onSelect,
  isConnected,
  isOAuth,
  connectedCount = 0,
}) => {
  // OAuth providers (Gmail) can always add more accounts
  const isDisabled = isConnected && !isOAuth;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isDisabled && styles.cardConnected,
        isOAuth && styles.cardOAuth,
      ]}
      onPress={onSelect}
      disabled={isDisabled}
    >
      <View style={[styles.iconContainer, { borderColor: provider.iconColor }]}>
        <MaterialCommunityIcons
          name={provider.icon as any}
          size={28}
          color={provider.iconColor}
        />
      </View>

      <Text style={styles.name}>{provider.name}</Text>

      {isDisabled ? (
        <View style={styles.connectedBadge}>
          <MaterialCommunityIcons name="check-circle" size={14} color="#00FF88" />
          <Text style={styles.connectedText}>Connected</Text>
        </View>
      ) : isOAuth && connectedCount > 0 ? (
        <View style={styles.oauthBadge}>
          <MaterialCommunityIcons name="plus" size={12} color="#00FF88" />
          <Text style={styles.oauthText}>Add Another</Text>
        </View>
      ) : isOAuth ? (
        <View style={styles.oauthBadge}>
          <MaterialCommunityIcons name="lightning-bolt" size={12} color="#00FF88" />
          <Text style={styles.oauthText}>Instant</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardConnected: {
    borderColor: 'rgba(0,255,136,0.3)',
    opacity: 0.6,
  },
  cardOAuth: {
    borderColor: 'rgba(0,255,136,0.2)',
    backgroundColor: 'rgba(0,255,136,0.04)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
  },
  name: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#fff',
    textAlign: 'center',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  connectedText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: '#00FF88',
  },
  oauthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,255,136,0.15)',
    borderRadius: 8,
    gap: 3,
  },
  oauthText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: '#00FF88',
  },
});

export default EmailProviderCard;
