/**
 * Email Provider Configurations
 * Supports: Gmail (OAuth), Outlook (OAuth), iCloud (Forwarding)
 *
 * All providers use real-time import — no IMAP polling.
 */

export interface EmailProvider {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  useOAuth?: boolean;
  useForwarding?: boolean;
  instructions: string[];
  helpUrl?: string;
  appPasswordUrl?: string;
}

export const EMAIL_PROVIDERS: Record<string, EmailProvider> = {
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    icon: 'gmail',
    iconColor: '#EA4335',
    useOAuth: true,
    instructions: [
      'Tap "Connect with Google"',
      'Sign in to your Google account',
      'Allow SpendTrak to read your emails',
      'Done! Receipts will sync automatically',
    ],
    helpUrl: 'https://support.google.com/accounts/answer/185833',
  },

  outlook: {
    id: 'outlook',
    name: 'Outlook',
    icon: 'microsoft-outlook',
    iconColor: '#0078D4',
    useOAuth: true,
    instructions: [
      'Tap "Connect with Microsoft"',
      'Sign in to your Microsoft account',
      'Allow SpendTrak to read your emails',
      'Done! Receipts will sync automatically',
    ],
    helpUrl: 'https://support.microsoft.com/en-us/account-billing/using-app-passwords',
  },

  icloud: {
    id: 'icloud',
    name: 'iCloud Mail',
    icon: 'apple',
    iconColor: '#555555',
    useForwarding: true,
    instructions: [
      'Copy your personal forwarding address',
      'Go to iCloud.com and sign in',
      'Open Mail, then click the gear icon',
      'Select "Rules" and click "Add a Rule"',
      'Set condition: "From" contains "receipt" OR "order"',
      'Action: "Forward to" and paste your address',
      'Save the rule',
      'Done! Forwarded receipts import automatically',
    ],
    helpUrl: 'https://support.apple.com/en-us/HT204397',
  },
};

export default EMAIL_PROVIDERS;
