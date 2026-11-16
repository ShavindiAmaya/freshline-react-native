import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { FoodItem, getDaysRemaining } from '@/types/food';

// Configure foreground notification presentation (SDK 58 compatible)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// 1. Request notification permission appropriately
export async function requestNotificationPermission(
  askPermission = false
): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const current = await Notifications.getPermissionsAsync();

    if (current.granted) {
      return true;
    }

    if (!askPermission || !current.canAskAgain) {
      return false;
    }

    const result = await Notifications.requestPermissionsAsync();
    return result.granted;
  } catch (error) {
    console.error('Notification permission setup failed:', error);
    return false;
  }
}

// Helper: build notification title and message from real food item
export function getExpiryNotificationContent(item: FoodItem): {
  title: string;
  body: string;
} {
  const days = getDaysRemaining(item.expiryDate);

  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      title: 'Food Expired',
      body: `${item.name} expired ${absDays === 1 ? 'yesterday' : `${absDays} days ago`}. Check before using.`,
    };
  }

  if (days === 0) {
    return {
      title: 'Expires Today!',
      body: `${item.name} expires today!`,
    };
  }

  if (days === 1) {
    return {
      title: 'Food Expiring Soon',
      body: `${item.name} expires tomorrow!`,
    };
  }

  return {
    title: 'Freshline Reminder',
    body: `${item.name} expires in ${days} days!`,
  };
}

// Helper: current local date string (YYYY-MM-DD)
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStorageKey(userId: string): string {
  return `@freshline_scheduled_notifs_${userId}`;
}

// Helper: get persisted notification tracking state from AsyncStorage
async function getPersistedState(
  userId: string
): Promise<Record<string, { expiryDate: string; notifiedDate: string }>> {
  try {
    const json = await AsyncStorage.getItem(getStorageKey(userId));
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

// Helper: save persisted notification tracking state
async function savePersistedState(
  userId: string,
  state: Record<string, { expiryDate: string; notifiedDate: string }>
): Promise<void> {
  try {
    await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save notification tracking state:', err);
  }
}

// 2. Schedule real inventory-based expiry notification for a single item
export async function scheduleExpiryNotifications(
  item: FoodItem,
  userId: string,
  delaySeconds = 120
): Promise<void> {
  if (Platform.OS === 'web' || item.isUsed || !userId || !item.expiryDate) {
    return;
  }

  try {
    const isEnabled = await AsyncStorage.getItem('@freshline_notifications_enabled');
    if (isEnabled === 'false') return;

    const hasPermission = await requestNotificationPermission(false);
    if (!hasPermission) return;

    const days = getDaysRemaining(item.expiryDate);
    // Only items expiring in <= 3 days, today, or already expired
    if (days > 3) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const isAlreadyPending = scheduled.some((n) => {
      const data = n.content.data;
      return (
        data?.source === 'freshline_expiry' &&
        data?.userId === userId &&
        data?.productId === item.id &&
        data?.expiryDate === item.expiryDate
      );
    });

    if (isAlreadyPending) return;

    const content = getExpiryNotificationContent(item);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        data: {
          source: 'freshline_expiry',
          userId,
          productId: item.id,
          expiryDate: item.expiryDate,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: delaySeconds,
      },
    });

    const state = await getPersistedState(userId);
    state[item.id] = {
      expiryDate: item.expiryDate,
      notifiedDate: getTodayDateString(),
    };
    await savePersistedState(userId, state);
  } catch (err) {
    console.error(`Failed to schedule notification for ${item.name}:`, err);
  }
}

// 3. Cancel notifications for a specific product (on delete or marked as used)
export async function cancelProductNotifications(
  productId: string,
  userId?: string
): Promise<void> {
  if (Platform.OS === 'web' || !productId) return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      const data = notif.content.data;
      if (
        data?.source === 'freshline_expiry' &&
        data?.productId === productId &&
        (!userId || data?.userId === userId)
      ) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    if (userId) {
      const state = await getPersistedState(userId);
      if (state[productId]) {
        delete state[productId];
        await savePersistedState(userId, state);
      }
    }
  } catch (err) {
    console.error(`Failed to cancel notifications for product ${productId}:`, err);
  }
}

// 4. Synchronize real Supabase food items into a 2-minute interval queue
export async function syncExpiryNotifications(
  items: FoodItem[],
  userId: string
): Promise<void> {
  if (Platform.OS === 'web' || !userId) return;

  try {
    const isEnabled = await AsyncStorage.getItem('@freshline_notifications_enabled');
    if (isEnabled === 'false') return;

    const hasPermission = await requestNotificationPermission(false);
    if (!hasPermission) return;

    const todayStr = getTodayDateString();
    const persistedState = await getPersistedState(userId);
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    // 1. Cancel pending notifications for items that were deleted or marked as used
    const activeItemIds = new Set(
      items.filter((i) => !i.isUsed).map((i) => i.id)
    );

    for (const notif of scheduled) {
      const data = notif.content.data;
      if (data?.source === 'freshline_expiry' && data?.userId === userId) {
        const productId = typeof data?.productId === 'string' ? data.productId : '';
        if (productId && !activeItemIds.has(productId)) {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }
    }

    // 2. Filter eligible items: not used, has expiry date, expiring in <= 3 days (including today & expired)
    const eligibleItems = items.filter((item) => {
      if (item.isUsed || !item.expiryDate) return false;
      const days = getDaysRemaining(item.expiryDate);
      return days <= 3;
    });

    // 3. Sort by earliest expiry date first
    eligibleItems.sort((a, b) => {
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });

    // 4. Schedule queue with 2-minute gap (120s, 240s, 360s, ...)
    let queuePosition = 1;
    let stateChanged = false;

    for (const item of eligibleItems) {
      // Check if already pending in OS notification queue
      const isAlreadyPending = scheduled.some((n) => {
        const data = n.content.data;
        return (
          data?.source === 'freshline_expiry' &&
          data?.userId === userId &&
          data?.productId === item.id &&
          data?.expiryDate === item.expiryDate
        );
      });

      if (isAlreadyPending) {
        continue;
      }

      // Check if already notified today for this exact expiry date
      const recorded = persistedState[item.id];
      if (
        recorded &&
        recorded.expiryDate === item.expiryDate &&
        recorded.notifiedDate === todayStr
      ) {
        continue;
      }

      const delaySeconds = queuePosition * 120; // 2m, 4m, 6m...
      queuePosition++;

      const content = getExpiryNotificationContent(item);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          data: {
            source: 'freshline_expiry',
            userId,
            productId: item.id,
            expiryDate: item.expiryDate,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: delaySeconds,
        },
      });

      persistedState[item.id] = {
        expiryDate: item.expiryDate,
        notifiedDate: todayStr,
      };
      stateChanged = true;
    }

    if (stateChanged) {
      await savePersistedState(userId, persistedState);
    }

    console.log(
      `[Freshline] Real expiry notifications synced: ${queuePosition - 1} scheduled.`
    );
  } catch (error) {
    console.error('Failed to sync real inventory notifications:', error);
  }
}

// 5. Cancel all notifications for a user (called on logout)
export async function cancelAllExpiryNotifications(
  userId?: string
): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      const data = notif.content.data;
      if (
        data?.source === 'freshline_expiry' &&
        (!userId || data?.userId === userId)
      ) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    if (userId) {
      await AsyncStorage.removeItem(getStorageKey(userId));
    }
  } catch (err) {
    console.error('Failed to cancel all expiry notifications:', err);
  }
}

// 6. Test notification scheduled 10 seconds from now (preserves working single test)
export async function sendTestNotification(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const hasPermission = await requestNotificationPermission(true);
    if (!hasPermission) {
      throw new Error(
        'Notification permission is disabled. Please enable it in your device settings.'
      );
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Freshline Test',
        body: 'Notifications are working!',
        data: { source: 'freshline_test' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
      },
    });

    console.log('Test notification scheduled:', id);
    return id;
  } catch (error) {
    console.error('Test notification failed:', error);
    throw error;
  }
}

// 7. Test all real inventory-based expiry notifications (loads actual Supabase items)
export async function testAllExpiryNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  const allowed = await requestNotificationPermission(true);
  if (!allowed) {
    throw new Error('Notification permission denied');
  }

  // Fetch actual items from Supabase using existing inventory service
  const { getFoodItems } = await import(
    '@/features/inventory/services/inventory.service'
  );
  const items = await getFoodItems();

  const { supabase } = await import('@/lib/supabase');
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Please sign in to test inventory notifications.');
  }

  // Clear previous notifications & state to allow immediate re-test of current inventory
  await cancelAllExpiryNotifications(user.id);

  // Sync real inventory items with 2-minute gap
  await syncExpiryNotifications(items, user.id);
}
