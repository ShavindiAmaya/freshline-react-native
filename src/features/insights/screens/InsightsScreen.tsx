import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';

import { FreshTheme } from '@/constants/freshline-theme';
import type { WasteRecord } from '@/types/waste';
import {
  calculateMonthlyAnalytics,
  filterRecordsByMonth,
  roundWasteRate,
  type MonthlyAnalytics,
} from '../services/analytics.service';
import { listWasteRecords } from '../services/waste.service';

/**
 * Loads waste records from the database for the authenticated user.
 */
async function loadRecords(): Promise<WasteRecord[]> {
  return await listWasteRecords();
}

export default function InsightsScreen() {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<MonthlyAnalytics | null>(null);

  const fetchInsights = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      const records = await loadRecords();
      // Filter for current month and compute metrics
      const currentMonthRecords = filterRecordsByMonth(records, new Date());
      const computed = calculateMonthlyAnalytics(currentMonthRecords);
      setAnalytics(computed);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Failed to load insights. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Loading state view
  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={FreshTheme.colors.primary} />
        <Text style={styles.loadingText}>Calculating monthly insights...</Text>
      </View>
    );
  }

  // Error state view
  if (errorMessage) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Could not load insights</Text>
        <Text style={styles.errorSubtitle}>{errorMessage}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => fetchInsights(false)}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const isEmpty = !analytics || analytics.totalCount === 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchInsights(true)}
          tintColor={FreshTheme.colors.primary}
          colors={[FreshTheme.colors.primary]}
        />
      }>
      {/* Screen Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenHeading}>This Month</Text>
          <Text style={styles.screenSubheading}>
            Food consumption & waste balance
          </Text>
        </View>
      </View>

      {/* Empty State */}
      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyTitle}>No finished foods this month</Text>
          <Text style={styles.emptySubtitle}>
            When you mark food items as Consumed or Wasted, your monthly waste rate and top categories will appear here.
          </Text>
        </View>
      ) : (
        <>
          {/* Top Row: Consumed (Green) & Wasted (Red) Side-by-Side Cards */}
          <View style={styles.statsRow}>
            {/* Consumed Card (Green) */}
            <View style={[styles.statCard, styles.consumedCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>✅</Text>
                <View style={styles.consumedPill}>
                  <Text style={styles.consumedPillText}>Saved</Text>
                </View>
              </View>
              <Text style={styles.statCountGreen}>{analytics.consumedCount}</Text>
              <Text style={styles.statLabel}>Consumed</Text>
              <Text style={styles.statUnit}>items eaten</Text>
            </View>

            {/* Wasted Card (Red) */}
            <View style={[styles.statCard, styles.wastedCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🗑️</Text>
                <View style={styles.wastedPill}>
                  <Text style={styles.wastedPillText}>Wasted</Text>
                </View>
              </View>
              <Text style={styles.statCountRed}>{analytics.wastedCount}</Text>
              <Text style={styles.statLabel}>Wasted</Text>
              <Text style={styles.statUnit}>items discarded</Text>
            </View>
          </View>

          {/* Waste Rate Card with Progress Bar */}
          <View style={styles.rateCard}>
            <View style={styles.rateHeaderRow}>
              <View>
                <Text style={styles.cardCategoryLabel}>MONTHLY RATIO</Text>
                <Text style={styles.rateCardTitle}>Waste Rate</Text>
              </View>
              <View style={styles.rateBadge}>
                <Text style={styles.rateBadgeText}>
                  {roundWasteRate(analytics.wasteRate)}%
                </Text>
              </View>
            </View>

            <Text style={styles.rateSummaryText}>
              {analytics.wastedCount} of {analytics.totalCount} items finished were wasted this month.
            </Text>

            {/* Simple visual progress bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, Math.max(0, analytics.wasteRate))}%` },
                ]}
              />
            </View>

            <View style={styles.progressLabels}>
              <Text style={styles.progressLabelText}>0% (Zero Waste)</Text>
              <Text style={styles.progressLabelText}>100%</Text>
            </View>
          </View>

          {/* Most Wasted Category Card */}
          <View style={styles.categoryCard}>
            <View style={styles.categoryIconCircle}>
              <Text style={styles.categoryIconEmoji}>📊</Text>
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.cardCategoryLabel}>HIGH IMPACT AREA</Text>
              <Text style={styles.categoryTitle}>Most Wasted Category</Text>
              <Text style={styles.categoryHighlight}>
                {analytics.mostWastedCategory || 'None'}
              </Text>
            </View>
          </View>

          {/* Helpful Tip Footer */}
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Quick tip</Text>
            <Text style={styles.tipBody}>
              Focus on buying smaller quantities of {analytics.mostWastedCategory || 'perishables'} to push your waste rate even lower!
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: FreshTheme.colors.screenBg,
  },
  contentContainer: {
    paddingHorizontal: FreshTheme.spacing.lg,
    paddingTop: FreshTheme.spacing.lg,
    paddingBottom: FreshTheme.spacing.xxxl,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: FreshTheme.colors.screenBg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: FreshTheme.spacing.xl,
  },
  loadingText: {
    marginTop: FreshTheme.spacing.md,
    fontSize: 14,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: FreshTheme.spacing.sm,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    marginBottom: FreshTheme.spacing.xs,
  },
  errorSubtitle: {
    fontSize: 13,
    color: FreshTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: FreshTheme.spacing.lg,
  },
  retryButton: {
    backgroundColor: FreshTheme.colors.primaryDark,
    paddingHorizontal: FreshTheme.spacing.xl,
    paddingVertical: FreshTheme.spacing.md,
    borderRadius: FreshTheme.borderRadius.lg,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: FreshTheme.spacing.lg,
  },
  screenHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  screenSubheading: {
    fontSize: 13,
    color: FreshTheme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.xl,
    padding: FreshTheme.spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    marginTop: FreshTheme.spacing.md,
    ...FreshTheme.shadows.card,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: FreshTheme.spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    marginBottom: FreshTheme.spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: FreshTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    gap: FreshTheme.spacing.md,
    marginBottom: FreshTheme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.xl,
    padding: FreshTheme.spacing.lg,
    borderWidth: 1,
    ...FreshTheme.shadows.card,
  },
  consumedCard: {
    borderColor: FreshTheme.colors.primaryBorder,
    backgroundColor: FreshTheme.colors.primarySubtle,
  },
  wastedCard: {
    borderColor: FreshTheme.colors.useToday.badgeBorder,
    backgroundColor: FreshTheme.colors.useToday.badgeBg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: FreshTheme.spacing.xs,
  },
  cardIcon: {
    fontSize: 18,
  },
  consumedPill: {
    backgroundColor: FreshTheme.colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: FreshTheme.borderRadius.sm,
  },
  consumedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
  },
  wastedPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: FreshTheme.borderRadius.sm,
  },
  wastedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: FreshTheme.colors.useToday.text,
  },
  statCountGreen: {
    fontSize: 32,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
    letterSpacing: -1,
  },
  statCountRed: {
    fontSize: 32,
    fontWeight: '800',
    color: FreshTheme.colors.useToday.text,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: FreshTheme.colors.textPrimary,
    marginTop: 2,
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: FreshTheme.colors.textMuted,
  },
  rateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.xl,
    padding: FreshTheme.spacing.lg,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    marginBottom: FreshTheme.spacing.md,
    ...FreshTheme.shadows.card,
  },
  rateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: FreshTheme.spacing.xs,
  },
  cardCategoryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: FreshTheme.colors.textMuted,
    letterSpacing: 0.8,
  },
  rateCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
  },
  rateBadge: {
    backgroundColor: FreshTheme.colors.useToday.badgeBg,
    borderColor: FreshTheme.colors.useToday.badgeBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: FreshTheme.borderRadius.full,
  },
  rateBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: FreshTheme.colors.useToday.text,
  },
  rateSummaryText: {
    fontSize: 12,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    marginBottom: FreshTheme.spacing.md,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: FreshTheme.borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: FreshTheme.colors.useToday.barColor,
    borderRadius: FreshTheme.borderRadius.full,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabelText: {
    fontSize: 10,
    color: FreshTheme.colors.textMuted,
    fontWeight: '600',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.xl,
    padding: FreshTheme.spacing.lg,
    borderWidth: 1,
    borderColor: FreshTheme.colors.borderLight,
    marginBottom: FreshTheme.spacing.md,
    ...FreshTheme.shadows.card,
  },
  categoryIconCircle: {
    width: 46,
    height: 46,
    borderRadius: FreshTheme.borderRadius.lg,
    backgroundColor: FreshTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: FreshTheme.spacing.md,
  },
  categoryIconEmoji: {
    fontSize: 22,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: FreshTheme.colors.textPrimary,
  },
  categoryHighlight: {
    fontSize: 16,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
    marginTop: 2,
  },
  tipCard: {
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderRadius: FreshTheme.borderRadius.lg,
    padding: FreshTheme.spacing.md,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: FreshTheme.colors.primaryDark,
    marginBottom: 2,
  },
  tipBody: {
    fontSize: 11,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    lineHeight: 16,
  },
});
