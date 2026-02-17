// ConnectedEmailCard.tsx - Shows connected email with sync/disconnect options
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmailConnection } from '@/services/emailImport';
import { EMAIL_PROVIDERS } from '@/config/emailProviders';
import { FontFamily, FontSize } from '@/design/cinematic';

interface ConnectedEmailCardProps {
  connection: EmailConnection;
  onDisconnect: () => void;
}

export const ConnectedEmailCard: React.FC<ConnectedEmailCardProps> = ({
  connection,
  onDisconnect,
}) => {
  const provider = EMAIL_PROVIDERS[connection.provider];
  const iconName = provider?.icon || 'email';
  const iconColor = provider?.iconColor || '#888';

  const formatLastSync = () => {
    if (!connection.last_sync_at) return 'Never synced';

    const date = new Date(connection.last_sync_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const isForwarding = connection.auth_type === 'forwarding';

  const getStatusColor = () => {
    if (connection.last_sync_status === 'success' || isForwarding) return '#00FF88';
    if (connection.last_sync_status === 'failed') return '#FF4444';
    if (connection.last_sync_status === 'partial') return '#FFaa00';
    if (connection.last_sync_status === 'watching') return '#00FF88';
    return '#00FF88';
  };

  const getStatusText = () => {
    if (isForwarding) return 'Forwarding active';
    if (connection.last_sync_status === 'watching') return 'Watching';
    return 'Auto-sync active';
  };

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={[styles.iconContainer, { borderColor: iconColor }]}>
          <MaterialCommunityIcons name={iconName as any} size={24} color={iconColor} />
        </View>

        <View style={styles.info}>
          <Text style={styles.email} numberOfLines={1}>
            {connection.email}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.statusText}>{getStatusText()}</Text>
            <Text style={styles.syncTime}> • {formatLastSync()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.autoSyncBadge}>
          <MaterialCommunityIcons
            name={isForwarding ? 'email-fast' : 'lightning-bolt'}
            size={16}
            color="#00FF88"
          />
        </View>

        <TouchableOpacity style={styles.disconnectButton} onPress={onDisconnect}>
          <MaterialCommunityIcons name="link-variant-off" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
  },
  info: {
    flex: 1,
  },
  email: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
    color: '#fff',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#888',
  },
  syncTime: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autoSyncBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,255,136,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.3)',
  },
  disconnectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,107,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ConnectedEmailCard;
