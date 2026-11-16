
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FreshTheme } from '@/constants/freshline-theme';
import { supabase } from '@/lib/supabase';
import { ProfileScreenProps } from '../types/auth.types';


// Extract initials
function extractInitials(fullName?: string, email?: string): string {
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);

    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    return parts[0].slice(0, 2).toUpperCase();
  }

  if (email && email.trim()) {
    return email.trim().slice(0, 2).toUpperCase();
  }

  return 'FL';
}


// Format date
function formatDate(isoString?: string | null): string {
  if (!isoString) return 'N/A';

  try {
    const date = new Date(isoString);

    if (isNaN(date.getTime())) return 'N/A';

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

// Profile Screen
export function ProfileScreen({
  user,
  onSignOut,
  isLoading = false,
}: ProfileScreenProps) {
  const [databaseDisplayName, setDatabaseDisplayName] = useState<string | null>(
    null
  );

  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const [profileLoadError, setProfileLoadError] = useState<string | null>(
    null
  );

  // Load profile from Supabase
  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      setIsProfileLoading(true);
      setProfileLoadError(null);
      setDatabaseDisplayName(null);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!isActive) return;

        const name =
          typeof data?.display_name === 'string'
            ? data.display_name.trim()
            : '';

        setDatabaseDisplayName(name || null);

        if (!name) {
          setProfileLoadError(
            'Profile record not found. Showing account name instead.'
          );
        }
      } catch (error) {
        if (!isActive) return;

        console.error('Failed to load user profile:', error);

        setDatabaseDisplayName(null);

        setProfileLoadError(
          'Could not load profile details. Showing account name instead.'
        );
      } finally {
        if (isActive) {
          setIsProfileLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, [user.id]);

  // Resolve display name
  const metadataDisplayName =
    typeof user.user_metadata?.display_name === 'string'
      ? user.user_metadata.display_name.trim()
      : '';

  const metadataFullName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name.trim()
      : '';

  const fullName =
    databaseDisplayName ||
    metadataDisplayName ||
    metadataFullName ||
    'FreshLine Member';

  const email = user.email || 'No email registered';

  const initials = extractInitials(fullName, user.email);

  // Email verification status
  const isEmailVerified = Boolean(
    user.email_confirmed_at || (user as any).confirmed_at
  );

  // Account information
  const accountCreatedDate = formatDate(user.created_at);
  const lastSignInDate = formatDate(user.last_sign_in_at);

  const handleSignOutPress = () => {
    if (isLoading) return;

    onSignOut?.();
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>🌱</Text>
            </View>

            <Text style={styles.brandTitle}>FreshLine</Text>

            <Text style={styles.brandTagline}>
              Track Freshness. Reduce Waste.
            </Text>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            {/* Connection Status */}
            <View style={styles.connectionPill}>
              <View style={styles.connectionDot} />

              <Text style={styles.connectionText}>
                Supabase Authenticated
              </Text>
            </View>

            {/* Avatar with Initials */}
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {initials}
                </Text>
              </View>

              {isEmailVerified && (
                <View
                  style={styles.verifiedBadge}
                  accessibilityLabel="Verified account badge"
                >
                  <Text style={styles.verifiedBadgeIcon}>
                    ✓
                  </Text>
                </View>
              )}
            </View>

            {/* User Name */}
            <Text style={styles.userName} numberOfLines={2}>
              {fullName}
            </Text>

            {/* Profile Loading / Error / Success Status */}
            {isProfileLoading ? (
              <View style={styles.profileStatusRow}>
                <ActivityIndicator
                  size="small"
                  color={FreshTheme.colors.primary}
                />

                <Text style={styles.profileStatusText}>
                  Loading profile details...
                </Text>
              </View>
            ) : profileLoadError ? (
              <Text style={styles.profileErrorText}>
                {profileLoadError}
              </Text>
            ) : (
              <Text style={styles.profileStatusText}>
                Profile loaded successfully
              </Text>
            )}

            {/* User Email */}
            <Text style={styles.userEmail} numberOfLines={1}>
              {email}
            </Text>

            {/* Email Verification Status */}
            <View
              style={[
                styles.verificationChip,
                isEmailVerified
                  ? styles.verificationChipVerified
                  : styles.verificationChipPending,
              ]}
            >
              <Text style={styles.verificationIcon}>
                {isEmailVerified ? '🛡️' : '⏳'}
              </Text>

              <Text
                style={[
                  styles.verificationChipText,
                  isEmailVerified
                    ? styles.verificationChipTextVerified
                    : styles.verificationChipTextPending,
                ]}
              >
                {isEmailVerified
                  ? 'Email Verified'
                  : 'Pending Verification'}
              </Text>
            </View>

            {/* Information Details Table */}
            <View style={styles.detailsTable}>
              {/* Full Name */}
              <View style={styles.detailRow}>
                <View style={styles.detailLabelCol}>
                  <Text style={styles.detailIcon}>👤</Text>
                  <Text style={styles.detailLabel}>Full Name</Text>
                </View>

                <Text style={styles.detailValue} numberOfLines={1}>
                  {fullName}
                </Text>
              </View>

              {/* Email */}
              <View style={styles.detailRow}>
                <View style={styles.detailLabelCol}>
                  <Text style={styles.detailIcon}>✉️</Text>
                  <Text style={styles.detailLabel}>Email</Text>
                </View>

                <Text
                  style={styles.detailValue}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {email}
                </Text>
              </View>

              {/* Account Created Date */}
              <View style={styles.detailRow}>
                <View style={styles.detailLabelCol}>
                  <Text style={styles.detailIcon}>📅</Text>
                  <Text style={styles.detailLabel}>Member Since</Text>
                </View>

                <Text style={styles.detailValue}>
                  {accountCreatedDate}
                </Text>
              </View>

              {/* Last Signed In */}
              {user.last_sign_in_at ? (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelCol}>
                    <Text style={styles.detailIcon}>🕒</Text>
                    <Text style={styles.detailLabel}>Last Sign In</Text>
                  </View>

                  <Text style={styles.detailValue}>
                    {lastSignInDate}
                  </Text>
                </View>
              ) : null}

              {/* User ID */}
              <View style={[styles.detailRow, styles.lastDetailRow]}>
                <View style={styles.detailLabelCol}>
                  <Text style={styles.detailIcon}>🔑</Text>
                  <Text style={styles.detailLabel}>User ID</Text>
                </View>

                <Text
                  style={[styles.detailValue, styles.monospaceValue]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {user.id}
                </Text>
              </View>
            </View>

            {/* Sign Out Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign out of FreshLine"
              accessibilityState={{
                disabled: isLoading,
                busy: isLoading,
              }}
              disabled={isLoading}
              onPress={handleSignOutPress}
              style={({ pressed }) => [
                styles.signOutButton,
                isLoading && styles.buttonDisabled,
                pressed && !isLoading && styles.buttonPressed,
              ]}
            >
              {isLoading ? (
                <View style={styles.buttonLoadingRow}>
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />

                  <Text style={styles.signOutButtonText}>
                    Signing Out...
                  </Text>
                </View>
              ) : (
                <View style={styles.buttonContentRow}>
                  <Text style={styles.signOutIcon}>🚪</Text>

                  <Text style={styles.signOutButtonText}>
                    Sign Out
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: FreshTheme.colors.screenBg,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: FreshTheme.spacing.lg,
    paddingVertical: FreshTheme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },

  contentContainer: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },

  brandContainer: {
    alignItems: 'center',
    marginBottom: FreshTheme.spacing.lg,
  },

  logoBadge: {
    width: 58,
    height: 58,
    borderRadius: FreshTheme.borderRadius.xl,
    backgroundColor: FreshTheme.colors.primaryLight,
    borderWidth: 1.5,
    borderColor: FreshTheme.colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: FreshTheme.spacing.xs,
    ...FreshTheme.shadows.soft,
  },

  logoIcon: {
    fontSize: 28,
  },

  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
    letterSpacing: -0.5,
  },

  brandTagline: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.2,
  },

  profileCard: {
    width: '100%',
    backgroundColor: FreshTheme.colors.cardBg,
    borderRadius: FreshTheme.borderRadius.xl,
    padding: FreshTheme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: FreshTheme.colors.borderGreenSubtle,
    ...FreshTheme.shadows.card,
  },

  connectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: FreshTheme.borderRadius.full,
    gap: 6,
    marginBottom: FreshTheme.spacing.lg,
  },

  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: FreshTheme.colors.primary,
  },

  connectionText: {
    fontSize: 11,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
    letterSpacing: 0.3,
  },

  avatarWrapper: {
    position: 'relative',
    marginBottom: FreshTheme.spacing.md,
  },

  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: FreshTheme.colors.primaryLight,
    borderWidth: 3,
    borderColor: FreshTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...FreshTheme.shadows.soft,
  },

  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
    letterSpacing: -0.5,
  },

  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: FreshTheme.colors.primary,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifiedBadgeIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 4,
  },

  profileStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: FreshTheme.spacing.xs,
  },

  profileStatusText: {
    fontSize: 11,
    color: FreshTheme.colors.textMuted,
    textAlign: 'center',
    marginBottom: FreshTheme.spacing.xs,
  },

  profileErrorText: {
    fontSize: 11,
    color: FreshTheme.colors.useToday.text,
    textAlign: 'center',
    marginBottom: FreshTheme.spacing.xs,
  },

  userEmail: {
    fontSize: 13,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: FreshTheme.spacing.md,
  },

  verificationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: FreshTheme.borderRadius.full,
    gap: 6,
    borderWidth: 1,
    marginBottom: FreshTheme.spacing.lg,
  },

  verificationChipVerified: {
    backgroundColor: FreshTheme.colors.fresh.badgeBg,
    borderColor: FreshTheme.colors.fresh.badgeBorder,
  },

  verificationChipPending: {
    backgroundColor: FreshTheme.colors.useSoon.badgeBg,
    borderColor: FreshTheme.colors.useSoon.badgeBorder,
  },

  verificationIcon: {
    fontSize: 12,
  },

  verificationChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  verificationChipTextVerified: {
    color: FreshTheme.colors.fresh.text,
  },

  verificationChipTextPending: {
    color: FreshTheme.colors.useSoon.text,
  },

  detailsTable: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: FreshTheme.borderRadius.lg,
    paddingHorizontal: FreshTheme.spacing.md,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    marginBottom: FreshTheme.spacing.xl,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },

  lastDetailRow: {
    borderBottomWidth: 0,
  },

  detailLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  detailIcon: {
    fontSize: 14,
  },

  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },

  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.textPrimary,
    maxWidth: 200,
    textAlign: 'right',
  },

  monospaceValue: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: FreshTheme.colors.textMuted,
  },

  signOutButton: {
    width: '100%',
    height: 50,
    backgroundColor: FreshTheme.colors.useToday.text,
    borderRadius: FreshTheme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...FreshTheme.shadows.soft,
  },

  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  signOutIcon: {
    fontSize: 16,
  },

  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});
