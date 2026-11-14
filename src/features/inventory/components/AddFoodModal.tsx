import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FreshTheme } from '@/constants/freshline-theme';
import { FoodCategory, StorageLocation } from '@/types/food';
import { CATEGORY_DEFAULT_ICONS } from '../services/inventoryService';
import {
  CreateFoodItemInput,
  InventoryValidationErrors,
} from '../types/inventory.types';
import {
  hasValidationErrors,
  VALID_FOOD_CATEGORIES,
  VALID_STORAGE_LOCATIONS,
  validateCreateFoodItem,
} from '../validation/inventoryValidation';

interface AddFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (item: CreateFoodItemInput) => Promise<void> | void;
}

const COMMON_UNITS = ['pcs', 'pack', 'g', 'kg', 'carton', 'can', 'bottle'];

const PRESET_EXPIRY_DAYS = [
  { label: 'Today (0d)', days: 0 },
  { label: '1 day', days: 1 },
  { label: '2 days', days: 2 },
  { label: '3 days', days: 3 },
  { label: '5 days', days: 5 },
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
];

export function AddFoodModal({ visible, onClose, onSave }: AddFoodModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('produce');
  const [location, setLocation] = useState<StorageLocation>('fridge');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [expiryDays, setExpiryDays] = useState(3);
  const [icon, setIcon] = useState('🥦');
  const [errors, setErrors] = useState<InventoryValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectCategory = (cat: FoodCategory) => {
    setCategory(cat);
    setIcon(CATEGORY_DEFAULT_ICONS[cat] || '🥗');
  };

  const calculateExpiryDateIso = (days: number): string => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    return targetDate.toISOString();
  };

  const handleResetForm = () => {
    setName('');
    setCategory('produce');
    setLocation('fridge');
    setQuantity('1');
    setUnit('pcs');
    setExpiryDays(3);
    setIcon('🥦');
    setErrors({});
    setIsSubmitting(false);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const parsedQty = parseFloat(quantity);
    const expiryDateIso = calculateExpiryDateIso(expiryDays);

    const inputPayload: CreateFoodItemInput = {
      name,
      category,
      storage_location: location,
      quantity: isNaN(parsedQty) ? 0 : parsedQty,
      unit,
      expiry_date: expiryDateIso,
      icon,
    };

    const validationErrors = validateCreateFoodItem(inputPayload);
    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await onSave(inputPayload);
      handleResetForm();
      onClose();
    } catch (e: any) {
      setErrors({ general: e.message || 'Failed to save food item' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.sheetContainer}>
          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Add Food Item</Text>
              <Text style={styles.sheetSubtitle}>
                Add a new item to track in your kitchen
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close form"
              onPress={handleClose}
              style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* General Error Banner */}
          {errors.general ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          ) : null}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* 1. Food Name Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Food Name *</Text>
              <View style={styles.inputWithIconRow}>
                <TextInput
                  style={[styles.textInput, errors.name ? styles.inputError : null]}
                  placeholder="e.g., Greek Yogurt, Fresh Apples"
                  placeholderTextColor={FreshTheme.colors.textMuted}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                />
                <View style={styles.iconPreviewBox}>
                  <Text style={styles.iconPreviewText}>{icon}</Text>
                </View>
              </View>
              {errors.name ? <Text style={styles.fieldErrorText}>{errors.name}</Text> : null}
            </View>

            {/* 2. Category Selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScrollRow}>
                {VALID_FOOD_CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => handleSelectCategory(cat)}
                      style={[
                        styles.chipBtn,
                        isSelected && styles.chipBtnActive,
                      ]}>
                      <Text style={styles.chipIcon}>{CATEGORY_DEFAULT_ICONS[cat]}</Text>
                      <Text
                        style={[
                          styles.chipLabel,
                          isSelected && styles.chipLabelActive,
                        ]}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {errors.category ? (
                <Text style={styles.fieldErrorText}>{errors.category}</Text>
              ) : null}
            </View>

            {/* 3. Storage Location Selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Storage Location *</Text>
              <View style={styles.gridRow}>
                {VALID_STORAGE_LOCATIONS.map((loc) => {
                  const isSelected = location === loc;
                  const locIcon = loc === 'fridge' ? '🧊' : loc === 'freezer' ? '❄️' : '🍞';
                  return (
                    <Pressable
                      key={loc}
                      onPress={() => setLocation(loc)}
                      style={[
                        styles.locationBtn,
                        isSelected && styles.locationBtnActive,
                      ]}>
                      <Text style={styles.locationBtnIcon}>{locIcon}</Text>
                      <Text
                        style={[
                          styles.locationBtnText,
                          isSelected && styles.locationBtnTextActive,
                        ]}>
                        {loc.charAt(0).toUpperCase() + loc.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.storage_location ? (
                <Text style={styles.fieldErrorText}>{errors.storage_location}</Text>
              ) : null}
            </View>

            {/* 4. Quantity and Unit */}
            <View style={styles.quantityUnitRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Quantity *</Text>
                <TextInput
                  style={[styles.textInput, errors.quantity ? styles.inputError : null]}
                  placeholder="1"
                  placeholderTextColor={FreshTheme.colors.textMuted}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={(val) => {
                    setQuantity(val);
                    if (errors.quantity)
                      setErrors((prev) => ({ ...prev, quantity: undefined }));
                  }}
                />
                {errors.quantity ? (
                  <Text style={styles.fieldErrorText}>{errors.quantity}</Text>
                ) : null}
              </View>

              <View style={[styles.fieldGroup, { flex: 1.5 }]}>
                <Text style={styles.fieldLabel}>Unit *</Text>
                <TextInput
                  style={[styles.textInput, errors.unit ? styles.inputError : null]}
                  placeholder="pcs, pack, g"
                  placeholderTextColor={FreshTheme.colors.textMuted}
                  value={unit}
                  onChangeText={(val) => {
                    setUnit(val);
                    if (errors.unit) setErrors((prev) => ({ ...prev, unit: undefined }));
                  }}
                />
                {errors.unit ? <Text style={styles.fieldErrorText}>{errors.unit}</Text> : null}
              </View>
            </View>

            {/* Quick unit suggestion pills */}
            <View style={styles.unitSuggestionsRow}>
              {COMMON_UNITS.map((u) => (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[
                    styles.unitChip,
                    unit.toLowerCase() === u && styles.unitChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.unitChipText,
                      unit.toLowerCase() === u && styles.unitChipTextActive,
                    ]}>
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* 5. Expiry Days Picker */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Expiry Timeframe *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScrollRow}>
                {PRESET_EXPIRY_DAYS.map((p) => {
                  const isSelected = expiryDays === p.days;
                  return (
                    <Pressable
                      key={p.label}
                      onPress={() => setExpiryDays(p.days)}
                      style={[
                        styles.expiryChip,
                        isSelected && styles.expiryChipActive,
                      ]}>
                      <Text
                        style={[
                          styles.expiryChipText,
                          isSelected && styles.expiryChipTextActive,
                        ]}>
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {errors.expiry_date ? (
                <Text style={styles.fieldErrorText}>{errors.expiry_date}</Text>
              ) : null}
            </View>

            {/* Submit Action Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save Food Item"
              disabled={isSubmitting}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Saving...' : '✓ Add Food to Inventory'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: FreshTheme.borderRadius.xl,
    borderTopRightRadius: FreshTheme.borderRadius.xl,
    paddingHorizontal: FreshTheme.spacing.lg,
    paddingTop: FreshTheme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
    ...FreshTheme.shadows.floating,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: FreshTheme.spacing.md,
    paddingBottom: FreshTheme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: FreshTheme.colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  errorBanner: {
    backgroundColor: FreshTheme.colors.useToday.badgeBg,
    borderColor: FreshTheme.colors.useToday.badgeBorder,
    borderWidth: 1,
    borderRadius: FreshTheme.borderRadius.md,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.useToday.text,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.textPrimary,
    marginBottom: 6,
  },
  fieldErrorText: {
    fontSize: 11,
    fontWeight: '600',
    color: FreshTheme.colors.useToday.text,
    marginTop: 4,
  },
  inputWithIconRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: FreshTheme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: FreshTheme.colors.textPrimary,
  },
  inputError: {
    borderColor: FreshTheme.colors.useToday.dot,
    backgroundColor: '#FEF2F2',
  },
  iconPreviewBox: {
    width: 46,
    height: 46,
    borderRadius: FreshTheme.borderRadius.md,
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPreviewText: {
    fontSize: 22,
  },
  chipsScrollRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: FreshTheme.borderRadius.full,
    gap: 6,
  },
  chipBtnActive: {
    backgroundColor: FreshTheme.colors.primaryLight,
    borderColor: FreshTheme.colors.primary,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
  chipLabelActive: {
    color: FreshTheme.colors.primaryDark,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  locationBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: FreshTheme.borderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationBtnActive: {
    backgroundColor: FreshTheme.colors.primaryLight,
    borderColor: FreshTheme.colors.primary,
  },
  locationBtnIcon: {
    fontSize: 16,
  },
  locationBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
  locationBtnTextActive: {
    color: FreshTheme.colors.primaryDark,
    fontWeight: '700',
  },
  quantityUnitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  unitSuggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
    marginTop: -4,
  },
  unitChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  unitChipActive: {
    backgroundColor: FreshTheme.colors.primaryLight,
  },
  unitChipText: {
    fontSize: 11,
    color: FreshTheme.colors.textSecondary,
    fontWeight: '500',
  },
  unitChipTextActive: {
    color: FreshTheme.colors.primaryDark,
    fontWeight: '700',
  },
  expiryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: FreshTheme.borderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  expiryChipActive: {
    backgroundColor: FreshTheme.colors.primaryLight,
    borderColor: FreshTheme.colors.primary,
  },
  expiryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
  expiryChipTextActive: {
    color: FreshTheme.colors.primaryDark,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: FreshTheme.colors.primary,
    borderRadius: FreshTheme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    ...FreshTheme.shadows.card,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
