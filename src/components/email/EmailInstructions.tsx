import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmailProvider } from '@/config/emailProviders';
import { useTranslation } from '@/context/LanguageContext';
import { FontFamily, FontSize, Colors } from '../../design/cinematic';

interface Props {
  provider: EmailProvider;
  onClose: () => void;
}

export const EmailInstructions: React.FC<Props> = ({ provider, onClose }) => {
  const { t } = useTranslation();

  const openAppPasswordPage = () => {
    if (provider.appPasswordUrl) {
      Linking.openURL(provider.appPasswordUrl);
    }
  };

  const openHelpPage = () => {
    if (provider.helpUrl) {
      Linking.openURL(provider.helpUrl);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name={provider.icon as any}
          size={40}
          color={provider.iconColor}
        />
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('settings.connectProvider', { provider: provider.name })}</Text>
          <Text style={styles.subtitle}>{t('settings.followTheseSteps')}</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')}>
          <MaterialCommunityIcons name="close" size={24} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.instructionsTitle}>
          {t('settings.howToCreateAppPassword')}
        </Text>

        {provider.instructions.map((step, index) => (
          <View key={index} style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}

        {/* Open Settings Button */}
        {provider.appPasswordUrl && (
          <TouchableOpacity style={styles.primaryButton} onPress={openAppPasswordPage} accessibilityRole="button">
            <MaterialCommunityIcons name="open-in-new" size={20} color="#000" />
            <Text style={styles.primaryButtonText}>
              {t('settings.openProviderSettings', { provider: provider.name })}
            </Text>
          </TouchableOpacity>
        )}

        {/* Help Link */}
        {provider.helpUrl && (
          <TouchableOpacity style={styles.helpLink} onPress={openHelpPage} accessibilityRole="link">
            <MaterialCommunityIcons name="help-circle-outline" size={18} color="#888" />
            <Text style={styles.helpText}>{t('settings.needMoreHelp')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Security Note */}
      <View style={styles.securityNote} accessibilityRole="text">
        <MaterialCommunityIcons name="shield-check" size={22} color="#00FF88" />
        <Text style={styles.securityText}>
          {t('settings.appPasswordSecurityNote')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerText: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    color: '#fff',
    fontSize: FontSize.h4,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    color: '#888',
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionsTitle: {
    color: '#aaa',
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    marginBottom: 24,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.neon,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepNumberText: {
    color: '#000',
    fontSize: FontSize.body,
    fontFamily: FontFamily.bold,
  },
  stepText: {
    color: '#fff',
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
    flex: 1,
    lineHeight: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neon,
    borderRadius: 14,
    padding: 18,
    marginTop: 24,
    gap: 10,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 12,
    gap: 8,
  },
  helpText: {
    color: '#888',
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 14,
  },
  securityText: {
    color: '#aaa',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    flex: 1,
    lineHeight: 20,
  },
});

export default EmailInstructions;
