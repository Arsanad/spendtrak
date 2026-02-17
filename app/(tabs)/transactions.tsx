// SPENDTRAK CINEMATIC EDITION - Transactions Redirect
// Transactions are now embedded in the Home page
import { Redirect } from 'expo-router';

export default function TransactionsScreen() {
  return <Redirect href="/(tabs)" />;
}
