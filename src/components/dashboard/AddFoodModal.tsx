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
import { FoodCategory, FoodItem, StorageLocation } from '@/types/food';

interface AddFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (item: Omit<FoodItem, 'id' | 'created_at'>) => void;
}

const QUICK_PRESETS = [
  { name: 'Strawberries', category: 'produce' as FoodCategory, icon: '🍓', days: 3, location: 'fridge' as StorageLocation },
  { name: 'Avocado', category: 'produce' as FoodCategory, icon: '🥑', days: 2, location: 'pantry' as StorageLocation },
  { name: 'Greek Yogurt', category: 'dairy' as FoodCategory, icon: '🥣', days: 5, location: 'fridge' as StorageLocation },
  { name: 'Salmon Fillet', category: 'meat' as FoodCategory, icon: '🐟', days: 1, location: 'fridge' as StorageLocation },
  { name: 'Sourdough Bread', category: 'bakery' as FoodCategory, icon: '🍞', days: 4, location: 'pantry' as StorageLocation },
];

export function AddFoodModal({ visible, onClose, onSave }: AddFoodModalProps) {
  const [name, setName] = useState('');
  const [daysLeft, setDaysLeft] = useState('3');
  const [location, setLocation] = useState<StorageLocation>('fridge');
  const [icon, setIcon] = useState('🥗');

  const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setName(preset.name);
    setDaysLeft(preset.days.toString());
    setLocation(preset.location);
    setIcon(preset.icon);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const days = parseInt(daysLeft, 10) || 1;
    let status: FoodItem['status'] = 'fresh';
    let status_label: FoodItem['status_label'] = 'Fresh';

    if (days === 0) {
      status = 'use_today';
      status_label = 'Use Today';
    } else if (days <= 2) {
      status = 'use_soon';
      status_label = 'Use Soon';
    }

    onSave({
      name: name.trim(),
      category: 'produce',
      storage_location: location,
      quantity: 1,
      unit: 'item',
      days_left: days,
      expiry_date: new Date(Date.now() + days * 86400000).toISOString(),
      status,
      status_label,
      icon: icon || '🥗',
      notes: 'Added via FreshLine dashboard (Demo)',
    });

    // Reset form
    setName('');
    setDaysLeft('3');
    setLocation('fridge');
    setIcon('🥗');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Add Food to Track</Text>
              <Text style={styles.sheetSubtitle}>
                Prevent waste before it starts • Demo Data - Connection Pending
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Quick Presets */}
            <Text style={styles.fieldLabel}>Quick Suggestion</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsRow}>
              {QUICK_PRESETS.map((p) => (
                <Pressable
                  key={p.name}
                  onPress={() => handleApplyPreset(p)}
                  style={[
                    styles.presetPill,
                    name === p.name && styles.presetPillActive,
                  ]}>
                  <Text style={styles.presetIcon}>{p.icon}</Text>
                  <Text
                    style={[
                      styles.presetText,
                      name === p.name && styles.presetTextActive,
                    ]}>
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Food Name Input */}
            <Text style={styles.fieldLabel}>Food Name</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Avocado, Strawberries"
                placeholderTextColor={FreshTheme.colors.textMuted}
                value={name}
                onChangeText={setName}
              />
              <View style={styles.iconPickerBox}>
                <Text style={styles.iconPickerText}>{icon}</Text>
              </View>
            </View>

            {/* Days Left Input */}
            <Text style={styles.fieldLabel}>Days until Expiry</Text>
            <View style={styles.daysPickerRow}>
              {[
                { label: '0d (Today)', value: '0' },
                { label: '1 day', value: '1' },
                { label: '2 days', value: '2' },
                { label: '5 days', value: '5' },
                { label: '10 days', value: '10' },
              ].map((d) => (
                <Pressable
                  key={d.value}
                  onPress={() => setDaysLeft(d.value)}
                  style={[
                    styles.dayChip,
                    daysLeft === d.value && styles.dayChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.dayChipText,
                      daysLeft === d.value && styles.dayChipTextActive,
                    ]}>
                    {d.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Storage Location */}
            <Text style={styles.fieldLabel}>Storage Location</Text>
            <View style={styles.locationRow}>
              {(['fridge', 'freezer', 'pantry'] as StorageLocation[]).map((loc) => (
                <Pressable
                  key={loc}
                  onPress={() => setLocation(loc)}
                  style={[
                    styles.locationBtn,
                    location === loc && styles.locationBtnActive,
                  ]}>
                  <Text style={styles.locationIcon}>
                    {loc === 'fridge' ? '🧊' : loc === 'freezer' ? '❄️' : '🍞'}
                  </Text>
                  <Text
                    style={[
                      styles.locationText,
                      location === loc && styles.locationTextActive,
                    ]}>
                    {loc.charAt(0).toUpperCase() + loc.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Submit Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save Food Item"
              disabled={!name.trim()}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.saveButton,
                !name.trim() && styles.saveButtonDisabled,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.saveButtonText}>
                ✓ Add Item (Demo Mode)
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
    maxHeight: '85%',
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  presetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: FreshTheme.borderRadius.full,
    gap: 6,
  },
  presetPillActive: {
    backgroundColor: FreshTheme.colors.primaryLight,
    borderColor: FreshTheme.colors.primary,
  },
  presetIcon: {
    fontSize: 14,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
  presetTextActive: {
    color: FreshTheme.colors.primaryDark,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: FreshTheme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: FreshTheme.colors.textPrimary,
  },
  iconPickerBox: {
    width: 48,
    height: 48,
    borderRadius: FreshTheme.borderRadius.md,
    backgroundColor: FreshTheme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: FreshTheme.colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPickerText: {
    fontSize: 22,
  },
  daysPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: FreshTheme.borderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayChipActive: {
    backgroundColor: FreshTheme.colors.primaryLight,
    borderColor: FreshTheme.colors.primary,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
  dayChipTextActive: {
    color: FreshTheme.colors.primaryDark,
    fontWeight: '700',
  },
  locationRow: {
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
  locationIcon: {
    fontSize: 16,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: FreshTheme.colors.textSecondary,
  },
  locationTextActive: {
    color: FreshTheme.colors.primaryDark,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: FreshTheme.colors.primary,
    borderRadius: FreshTheme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    ...FreshTheme.shadows.card,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

