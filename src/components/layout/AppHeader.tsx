import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { UserProfile } from '@/types/food';

interface AppHeaderProps {
  user: UserProfile;
  unreadCount?: number;
  onPressNotification?: () => void;
  onPressAvatar?: () => void;
}

// App Header component
export function AppHeader({
  user,
  unreadCount = 3,
  onPressNotification,
  onPressAvatar,
}: AppHeaderProps) {
  // Greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 18) return 'Good afternoon!';
    return 'Good evening!';
  };

  // Capitalize first letter of name
  const firstName = (user.full_name || 'User').trim().split(' ')[0];
  const capitalizedName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : 'User';

  // Default avatar silhouette if no custom image
  const hasCustomAvatar = Boolean(user.avatar_url && !user.avatar_url.includes('unsplash'));
  const avatarSource = hasCustomAvatar
    ? { uri: user.avatar_url }
    : require('@/assets/images/default-avatar.png');

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🌱</Text>
          </View>
          <View style={styles.brandTextCol}>
            <Text style={styles.brandName}>FreshLine</Text>
            <Text style={styles.tagline}>Track Freshness. Reduce Waste.</Text>
          </View>
        </View>

        {/* Right action buttons */}
        <View style={styles.rightActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Notifications, ${unreadCount} alerts`}
            onPress={onPressNotification}
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}>
            <Text style={styles.bellGlyph}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View profile"
            onPress={onPressAvatar}
            style={({ pressed }) => [styles.avatarWrapper, pressed && styles.buttonPressed]}>
            <Image
              source={avatarSource}
              style={styles.avatarImage}
              contentFit="cover"
            />
            <View style={styles.avatarStatusDot} />
          </Pressable>
        </View>
      </View>

      {/* Greeting card */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingTitle}>
          {getGreeting()} <Text style={styles.userName}>{capitalizedName}</Text> 👋
        </Text>
        <Text style={styles.greetingSubtitle}>{user.tagline}</Text>
      </View>
    </View>
  );
}

// Alias for Header
export const Header = AppHeader;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoIcon: {
    fontSize: 22,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: -0.4,
  },
  tagline: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellGlyph: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: '#16A34A',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  greetingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  greetingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  userName: {
    color: '#15803D',
  },
  greetingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 2,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});
