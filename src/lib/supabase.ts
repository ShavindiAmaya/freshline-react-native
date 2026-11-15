
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing environment variable: EXPO_PUBLIC_SUPABASE_URL. Please set it in your .env configuration.'
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    'Missing environment variable: EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Please set it in your .env configuration.'
  );
}

/**
 * Shared Supabase Client for the FreshLine React Native Expo application.
 *
 * Configured with:
 * - AsyncStorage for native platforms (iOS / Android)
 * - Browser storage for web
 * - PKCE authentication flow
 * - Automatic token refresh
 * - Persistent sessions
 * - Manual URL code exchange for password recovery
 * - AppState listener to manage token refresh
 */

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      storage: Platform.OS !== 'web' ? AsyncStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  }
);

// Start auto-refresh when app becomes active,
// pause when app moves to the background.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
