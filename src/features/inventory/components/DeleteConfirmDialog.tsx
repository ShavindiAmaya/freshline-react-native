import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { FreshTheme } from '@/constants/freshline-theme';
import { FoodItem } from '@/types/food';

interface DeleteConfirmDialogProps {
  visible: boolean;
  item: FoodItem | null;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
}

export function DeleteConfirmDialog({
  visible,
  item,
  onCancel,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.dialogCard} onPress={(e) => e.stopPropagation()}>
          {/* Warning Icon Badge */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🗑️</Text>
          </View>

          {/* Dialog Title */}
          <Text style={styles.dialogTitle}>Delete Food Item?</Text>

          {/* Description with item name */}
          <Text style={styles.dialogDescription}>
            Are you sure you want to remove{' '}
            <Text style={styles.itemNameHighlight}>"{item.name}"</Text> from
            your kitchen inventory? This action cannot be undone.
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              disabled={isDeleting}
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.name}`}
              disabled={isDeleting}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.deleteBtn,
                isDeleting && styles.deleteBtnDisabled,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.deleteBtnText}>
                {isDeleting ? 'Deleting...' : 'Delete Item'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: FreshTheme.spacing.xl,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: FreshTheme.borderRadius.xl,
    padding: FreshTheme.spacing.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    ...FreshTheme.shadows.floating,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconText: {
    fontSize: 26,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: FreshTheme.colors.textPrimary,
    marginBottom: 8,
  },
  dialogDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: FreshTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  itemNameHighlight: {
    fontWeight: '700',
    color: FreshTheme.colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: FreshTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: FreshTheme.colors.textSecondary,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: FreshTheme.colors.useToday.text,
    paddingVertical: 12,
    borderRadius: FreshTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnDisabled: {
    opacity: 0.6,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
