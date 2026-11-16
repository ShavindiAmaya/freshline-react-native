import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FreshTheme } from '@/constants/freshline-theme';
import {
  InventoryOption,
  addInventoryOption,
  deleteInventoryOption,
  updateInventoryOption,
} from '@/features/inventory/services/inventory-options.service';

interface ManageOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  categories: InventoryOption[];
  storageLocations: InventoryOption[];
  onOptionsUpdated: () => void;
}

export function ManageOptionsModal({
  visible,
  onClose,
  categories,
  storageLocations,
  onOptionsUpdated,
}: ManageOptionsModalProps) {
  const [activeTab, setActiveTab] = useState<'storage_location' | 'category'>(
    'storage_location'
  );
  const [newOptionName, setNewOptionName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentOptions =
    activeTab === 'storage_location' ? storageLocations : categories;

  // Add a new option
  const handleAdd = async () => {
    setActionError(null);
    const trimmed = newOptionName.trim();
    if (!trimmed) {
      setActionError('Please enter a name for the option.');
      return;
    }

    setIsAdding(true);
    try {
      await addInventoryOption(activeTab, trimmed);
      setNewOptionName('');
      onOptionsUpdated();
    } catch (err: any) {
      setActionError(err.message || 'Failed to add option.');
    } finally {
      setIsAdding(false);
    }
  };

  // Start editing an option
  const startEditing = (opt: InventoryOption) => {
    setActionError(null);
    setEditingId(opt.id);
    setEditingName(opt.name);
  };

  // Save renamed option
  const handleSaveRename = async (optId: string) => {
    setActionError(null);
    const trimmed = editingName.trim();
    if (!trimmed) {
      setActionError('Option name cannot be empty.');
      return;
    }

    setIsRenaming(true);
    try {
      await updateInventoryOption(optId, trimmed);
      setEditingId(null);
      setEditingName('');
      onOptionsUpdated();
    } catch (err: any) {
      setActionError(err.message || 'Failed to rename option.');
      if (Platform.OS !== 'web') {
        Alert.alert('Cannot Rename', err.message);
      }
    } finally {
      setIsRenaming(false);
    }
  };

  // Delete option with confirmation
  const handleDelete = (opt: InventoryOption) => {
    setActionError(null);

    const performDelete = async () => {
      setDeletingId(opt.id);
      try {
        await deleteInventoryOption(opt.id);
        onOptionsUpdated();
      } catch (err: any) {
        setActionError(err.message || 'Failed to delete option.');
        if (Platform.OS !== 'web') {
          Alert.alert('Cannot Delete', err.message);
        }
      } finally {
        setDeletingId(null);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const ok = window.confirm(
          `Are you sure you want to delete "${opt.name}"?`
        );
        if (ok) void performDelete();
      } else {
        void performDelete();
      }
    } else {
      Alert.alert(
        'Delete Option',
        `Are you sure you want to delete "${opt.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => void performDelete(),
          },
        ]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheetCard}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Custom Inventory Options</Text>
              <Text style={styles.sheetSubtitle}>
                Manage your custom locations and categories
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabSwitcher}>
            <Pressable
              onPress={() => {
                setActiveTab('storage_location');
                setActionError(null);
                setEditingId(null);
              }}
              style={[
                styles.tabBtn,
                activeTab === 'storage_location' && styles.tabBtnActive,
              ]}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'storage_location' && styles.tabBtnTextActive,
                ]}>
                Storage Locations ({storageLocations.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setActiveTab('category');
                setActionError(null);
                setEditingId(null);
              }}
              style={[
                styles.tabBtn,
                activeTab === 'category' && styles.tabBtnActive,
              ]}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'category' && styles.tabBtnTextActive,
                ]}>
                Categories ({categories.length})
              </Text>
            </Pressable>
          </View>

          {/* Action error banner */}
          {actionError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {actionError}</Text>
            </View>
          ) : null}

          {/* Add Option Input Row */}
          <View style={styles.addRow}>
            <TextInput
              value={newOptionName}
              onChangeText={setNewOptionName}
              placeholder={
                activeTab === 'storage_location'
                  ? 'New location (e.g. Kitchen Shelf)'
                  : 'New category (e.g. Snacks)'
              }
              placeholderTextColor="#94A3B8"
              style={styles.addInput}
            />
            <Pressable
              disabled={!newOptionName.trim() || isAdding}
              onPress={handleAdd}
              style={[
                styles.addBtn,
                (!newOptionName.trim() || isAdding) && styles.addBtnDisabled,
              ]}>
              {isAdding ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.addBtnText}>+ Add</Text>
              )}
            </Pressable>
          </View>

          {/* Options List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}>
            {currentOptions.length === 0 ? (
              <Text style={styles.emptyText}>No options found. Add one above!</Text>
            ) : (
              currentOptions.map((opt) => {
                const isEditingThis = editingId === opt.id;
                const isDeletingThis = deletingId === opt.id;

                if (isEditingThis) {
                  return (
                    <View key={opt.id} style={styles.editRow}>
                      <TextInput
                        value={editingName}
                        onChangeText={setEditingName}
                        style={styles.editInput}
                        autoFocus
                      />
                      <Pressable
                        onPress={() => void handleSaveRename(opt.id)}
                        disabled={isRenaming}
                        style={styles.saveRenameBtn}>
                        <Text style={styles.saveRenameText}>Save</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setEditingId(null);
                          setEditingName('');
                        }}
                        style={styles.cancelRenameBtn}>
                        <Text style={styles.cancelRenameText}>Cancel</Text>
                      </Pressable>
                    </View>
                  );
                }

                return (
                  <View key={opt.id} style={styles.optionRow}>
                    <Text style={styles.optionName}>{opt.name}</Text>

                    <View style={styles.optionActions}>
                      <Pressable
                        onPress={() => startEditing(opt)}
                        style={styles.actionBtn}>
                        <Text style={styles.actionBtnText}>Rename</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleDelete(opt)}
                        disabled={isDeletingThis}
                        style={[
                          styles.actionBtn,
                          styles.deleteActionBtn,
                          isDeletingThis && { opacity: 0.5 },
                        ]}>
                        <Text style={styles.deleteActionText}>
                          {isDeletingThis ? '...' : 'Delete'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Close button */}
          <Pressable onPress={onClose} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  addInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  addBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  optionActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  deleteActionBtn: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  deleteActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  editRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#16A34A',
    borderRadius: 8,
    padding: 8,
  },
  editInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0F172A',
  },
  saveRenameBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveRenameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelRenameBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cancelRenameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  doneBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
