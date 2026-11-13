import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { FreshTheme } from '@/constants/freshline-theme';
import { UserProfile } from '@/types/food';

interface HeaderProps {
  user: UserProfile;
  unreadCount?: number;
  onPressNotification?: () => void;
  onPressAvatar?: () => void;
}

export function Header({
  user,
  unreadCount = 3,
  onPressNotification,
  onPressAvatar,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      {/* Top Bar: Brand & Action Icons */}
      <View style={styles.topBar}>
        {/* Brand identity */}
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🌱</Text>
          </View>
          <View style={styles.brandTextCol}>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandName}>FreshLine</Text>
              <View style={styles.demoPill}>
                <View style={styles.demoDot} />
                <Text style={styles.demoPillText}>DEMO</Text>
              </View>
            </View>
            <Text style={styles.tagline}>Track Freshness. Reduce Waste.</Text>
          </View>
        </View>

        {/* Right Icons: Notification & Avatar */}
        <View style={styles.rightActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Notifications, ${unreadCount} alerts`}
            onPress={onPressNotification}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.bellGlyph}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View profile"
            onPress={onPressAvatar}
            style={({ pressed }) => [
              styles.avatarWrapper,
              pressed && styles.buttonPressed,
            ]}>
            {user.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {user.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.avatarStatusDot} />
          </Pressable>
        </View>
      </View>

      {/* Greeting Banner */}
      <View style={styles.greetingContainer}>
        <View style={styles.greetingHeaderRow}>
          <Text style={styles.greetingTitle}>
            {user.greeting_time}{' '}
            <Text style={styles.userName}>{user.full_name.split(' ')[0]}</Text> 👋
          </Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {user.streak_days}d streak</Text>
          </View>
        </View>
        <Text style={styles.greetingSubtitle}>{user.tagline}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: FreshTheme.spacing.lg,
    paddingTop: FreshTheme.spacing.md,
    paddingBottom: FreshTheme.spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: FreshTheme.spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: FreshTheme.spacing.md,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: FreshTheme.borderRadius.lg,
    backgroundColor: FreshTheme.colors.primaryLight,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: FreshTheme.spacing.sm + 2,
    ...FreshTheme.shadows.soft,
  },
  logoIcon: {
    fontSize: 22,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
    letterSpacing: -0.5,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: FreshTheme.borderRadius.full,
    gap: 4,
  },
  demoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  demoPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
    letterSpacing: 0.2,
    marginTop: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FreshTheme.spacing.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: FreshTheme.borderRadius.full,
    backgroundColor: FreshTheme.colors.cardBg,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...FreshTheme.shadows.soft,
  },
  bellGlyph: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: FreshTheme.colors.useToday.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: FreshTheme.colors.cardBg,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  avatarWrapper: {
    width: 42,
    height: 42,
    borderRadius: FreshTheme.borderRadius.full,
    borderWidth: 2,
    borderColor: FreshTheme.colors.primary,
    position: 'relative',
    ...FreshTheme.shadows.soft,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: FreshTheme.borderRadius.full,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: FreshTheme.borderRadius.full,
    backgroundColor: FreshTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
  avatarStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: FreshTheme.colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  greetingContainer: {
    backgroundColor: FreshTheme.colors.cardBg,
    borderRadius: FreshTheme.borderRadius.lg,
    paddingHorizontal: FreshTheme.spacing.md + 2,
    paddingVertical: FreshTheme.spacing.md,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderGreenSubtle,
    ...FreshTheme.shadows.soft,
  },
  greetingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: FreshTheme.colors.textPrimary,
  },
  userName: {
    color: FreshTheme.colors.primaryDark,
  },
  greetingSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    lineHeight: 18,
  },
  streakBadge: {
    backgroundColor: FreshTheme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: FreshTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
    color: FreshTheme.colors.primaryDark,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});

