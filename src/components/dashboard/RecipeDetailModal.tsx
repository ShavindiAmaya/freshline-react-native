import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { FreshTheme } from '@/constants/freshline-theme';
import { Recipe } from '@/features/recipes/data/recipes';

interface RecipeDetailModalProps {
  visible: boolean;
  recipe: Recipe | null;
  onClose: () => void;
  onCookRecipe?: (recipe: Recipe) => void;
  matchScore?: number;
  availableIngredients?: string[];
  missingIngredients?: string[];
  expiringIngredients?: string[];
}

export function RecipeDetailModal({
  visible,
  recipe,
  onClose,
  onCookRecipe,
  matchScore,
  availableIngredients = [],
  missingIngredients = [],
  expiringIngredients = [],
}: RecipeDetailModalProps) {
  if (!recipe) return null;

  const hasInventoryData =
    availableIngredients.length > 0 || missingIngredients.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Header Image & Close Button */}
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: recipe.image }}
              style={styles.headerImage}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.imageOverlay} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close Recipe"
              onPress={onClose}
              style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>

            <View style={styles.imageBadgeRow}>
              {matchScore !== undefined && (
                <View
                  style={[
                    styles.badgePill,
                    {
                      backgroundColor:
                        matchScore >= 70
                          ? '#16A34A'
                          : matchScore >= 40
                          ? '#D97706'
                          : '#475569',
                    },
                  ]}>
                  <Text style={styles.badgePillText}>{matchScore}% Match</Text>
                </View>
              )}
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{recipe.badge}</Text>
              </View>
              <View
                style={[
                  styles.dietaryPill,
                  recipe.dietaryType === 'Vegetarian' && styles.dietaryPillVeg,
                  recipe.dietaryType === 'Vegan' && styles.dietaryPillVegan,
                ]}>
                <Text
                  style={[
                    styles.dietaryPillText,
                    recipe.dietaryType === 'Vegetarian' && styles.dietaryTextVeg,
                    recipe.dietaryType === 'Vegan' && styles.dietaryTextVegan,
                  ]}>
                  {recipe.dietaryType}
                </Text>
              </View>
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Title & Metadata */}
            <View style={styles.metaRow}>
              <Text style={styles.recipeTitle}>{recipe.name}</Text>
              <View style={styles.infoRow}>
                <View style={styles.infoChip}>
                  <Text style={styles.infoIcon}>⏱️</Text>
                  <Text style={styles.infoText}>{recipe.cookingTime}</Text>
                </View>
                <View style={styles.infoChip}>
                  <Text style={styles.infoIcon}>🍽️</Text>
                  <Text style={styles.infoText}>{recipe.category}</Text>
                </View>
                {recipe.cuisine && (
                  <View style={styles.infoChip}>
                    <Text style={styles.infoIcon}>🌍</Text>
                    <Text style={styles.infoText}>{recipe.cuisine}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Inventory Matching Summary Card */}
            {hasInventoryData && (
              <View style={styles.inventoryStatusCard}>
                <Text style={styles.inventoryStatusTitle}>
                  Kitchen Inventory Check
                </Text>

                {/* Available Ingredients */}
                {availableIngredients.length > 0 && (
                  <View style={styles.statusGroup}>
                    <Text style={styles.statusGroupLabel}>
                      ✓ In Your Kitchen ({availableIngredients.length}):
                    </Text>
                    <View style={styles.ingredientChipsRow}>
                      {availableIngredients.map((ing, idx) => {
                        const isExpiring = expiringIngredients.includes(ing);
                        return (
                          <View
                            key={idx}
                            style={[
                              styles.availableChip,
                              isExpiring && styles.expiringChip,
                            ]}>
                            <Text
                              style={[
                                styles.availableChipText,
                                isExpiring && styles.expiringChipText,
                              ]}>
                              {isExpiring ? `⚡ ${ing} (Expiring soon)` : `✓ ${ing}`}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Missing Ingredients */}
                {missingIngredients.length > 0 && (
                  <View style={[styles.statusGroup, { marginTop: 8 }]}>
                    <Text style={styles.statusGroupMissingLabel}>
                      🛒 Needed / Missing ({missingIngredients.length}):
                    </Text>
                    <View style={styles.ingredientChipsRow}>
                      {missingIngredients.map((ing, idx) => (
                        <View key={idx} style={styles.missingChip}>
                          <Text style={styles.missingChipText}>+ {ing}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Section: Required Ingredients */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Full Ingredients List</Text>
                <Text style={styles.sectionCount}>
                  {recipe.ingredients.length} items
                </Text>
              </View>
              <View style={styles.ingredientsList}>
                {recipe.ingredients.map((ing, idx) => (
                  <View key={idx} style={styles.ingredientRow}>
                    <View style={styles.ingredientBullet} />
                    <Text style={styles.ingredientText}>{ing}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section: Step-by-Step Instructions */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Cooking Instructions</Text>
              <View style={styles.instructionsList}>
                {recipe.cookingInstructions.map((step, idx) => (
                  <View key={idx} style={styles.instructionStep}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Allergy & Safety Disclaimer */}
            {recipe.allergens && recipe.allergens.length > 0 && (
              <View style={styles.allergenNoticeCard}>
                <Text style={styles.allergenNoticeText}>
                  ⚠️ Contains allergens: {recipe.allergens.join(', ')}. Please check
                  ingredient packages before consuming.
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            {onCookRecipe && (
              <Pressable
                onPress={() => onCookRecipe(recipe)}
                style={styles.cookBtn}>
                <Text style={styles.cookBtnText}>🍳 Cook This Recipe</Text>
              </Pressable>
            )}

            <Pressable onPress={onClose} style={styles.closeFooterBtn}>
              <Text style={styles.closeFooterBtnText}>Close Recipe</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '65%',
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    overflow: 'hidden',
    ...FreshTheme.shadows.floating,
  },
  imageWrapper: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  imageBadgeRow: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    flexDirection: 'row',
    gap: 8,
  },
  badgePill: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  dietaryPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dietaryPillVeg: {
    backgroundColor: '#DCFCE7',
  },
  dietaryPillVegan: {
    backgroundColor: '#E0F2FE',
  },
  dietaryPillText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  dietaryTextVeg: {
    color: '#15803D',
  },
  dietaryTextVegan: {
    color: '#0369A1',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 36,
  },
  metaRow: {
    marginBottom: 16,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  infoIcon: {
    fontSize: 12,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  inventoryStatusCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 14,
    marginBottom: 14,
  },
  inventoryStatusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 8,
  },
  statusGroup: {
    marginTop: 4,
  },
  statusGroupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 6,
  },
  statusGroupMissingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  ingredientChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  availableChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  availableChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  expiringChip: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  expiringChipText: {
    color: '#B45309',
    fontWeight: '700',
  },
  missingChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  missingChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  ingredientText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    flex: 1,
  },
  instructionsList: {
    gap: 12,
    marginTop: 10,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    flex: 1,
  },
  allergenNoticeCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    marginBottom: 14,
  },
  allergenNoticeText: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
  cookBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  cookBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  closeFooterBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeFooterBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
});
