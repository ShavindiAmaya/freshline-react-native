import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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
 * - Auto-refresh token enabled
 * - Session persistence enabled
 * - URL session detection disabled for mobile app lifecycle
 * - AppState listener to automatically pause token refresh in background
 *   and resume when the app is active
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: Platform.OS !== 'web' ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Start auto-refresh when app becomes active, pause when inactive
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

