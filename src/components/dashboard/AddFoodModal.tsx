import type { FoodItem, StorageLocation } from '@/types/food';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

interface AddFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (itemData: {
    id?: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    purchaseDate: string;
    expiryDate: string;
    storageLocation: StorageLocation;
  }) => void;
  itemToEdit?: FoodItem | null;
  initialValues?: {
    name: string;
    category: string;
    quantity: string;
    unit: string;
  } | null;
  categories?: string[];
  storageLocations?: string[];
  onManageOptions?: () => void;
  isSaving?: boolean;
}

const DEFAULT_CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat',
  'Bakery',
  'Pantry',
  'Beverages',
  'Other',
];

const UNITS = ['Pieces', 'kg', 'g', 'L', 'ml', 'Pack'];
const DEFAULT_LOCATIONS: StorageLocation[] = ['Fridge', 'Pantry', 'Freezer'];

// Helper to format date as YYYY-MM-DD
function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Match Open Food Facts categories to the categories configured in FreshLine.
function resolveScannedCategory(
  scannedCategory: string,
  availableCategories: string[]
): string {
  const value = scannedCategory.trim().toLowerCase();

  if (!value) {
    return (
      availableCategories.find((item) => item.toLowerCase() === 'other') ||
      availableCategories[0] ||
      'Other'
    );
  }

  const exactMatch = availableCategories.find(
    (item) => item.toLowerCase() === value
  );
  if (exactMatch) return exactMatch;

  const partialMatch = availableCategories.find((item) => {
    const candidate = item.toLowerCase();
    return value.includes(candidate) || candidate.includes(value);
  });
  if (partialMatch) return partialMatch;

  const categoryRules: { keywords: string[]; category: string }[] = [
    { keywords: ['milk', 'dairy', 'cheese', 'yogurt', 'butter'], category: 'Dairy' },
    { keywords: ['biscuit', 'cookie', 'bread', 'cake', 'pastry', 'bakery'], category: 'Bakery' },
    { keywords: ['chicken', 'beef', 'pork', 'meat', 'fish', 'seafood'], category: 'Meat' },
    { keywords: ['fruit', 'vegetable', 'produce', 'apple', 'banana', 'orange'], category: 'Produce' },
    { keywords: ['drink', 'beverage', 'juice', 'water', 'soda'], category: 'Beverages' },
    { keywords: ['rice', 'pasta', 'cereal', 'canned', 'snack', 'pantry'], category: 'Pantry' },
  ];

  const mappedRule = categoryRules.find((rule) =>
    rule.keywords.some((keyword) => value.includes(keyword))
  );

  if (mappedRule) {
    const mappedCategory = availableCategories.find(
      (item) => item.toLowerCase() === mappedRule.category.toLowerCase()
    );
    if (mappedCategory) return mappedCategory;
  }

  return (
    availableCategories.find((item) => item.toLowerCase() === 'other') ||
    availableCategories[0] ||
    'Other'
  );
}

export function AddFoodModal({
  visible,
  onClose,
  onSave,
  itemToEdit,
  initialValues,
  categories,
  storageLocations,
  onManageOptions,
  isSaving = false,
}: AddFoodModalProps) {
  const availableCategories =
    categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const availableLocations =
    storageLocations && storageLocations.length > 0
      ? storageLocations
      : DEFAULT_LOCATIONS;

  const [name, setName] = useState('');
  const [category, setCategory] = useState(availableCategories[0] || 'Produce');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('Pieces');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [storageLocation, setStorageLocation] = useState<StorageLocation>(
    availableLocations[0] || 'Fridge'
  );
  const [validationError, setValidationError] = useState('');

  // Pre-fill fields when opening in edit mode or set clean defaults for add
  useEffect(() => {
    if (visible) {
      setValidationError('');
      if (itemToEdit) {
        setName(itemToEdit.name);
        setCategory(itemToEdit.category || availableCategories[0] || 'Produce');
        setQuantity(String(itemToEdit.quantity || 1));
        setUnit(itemToEdit.unit || 'Pieces');
        setPurchaseDate(
          itemToEdit.purchaseDate
            ? itemToEdit.purchaseDate.split('T')[0]
            : formatDateToISO(new Date())
        );
        setExpiryDate(
          itemToEdit.expiryDate
            ? itemToEdit.expiryDate.split('T')[0]
            : formatDateToISO(new Date(Date.now() + 3 * 86400000))
        );
        setStorageLocation(
          itemToEdit.storageLocation || availableLocations[0] || 'Fridge'
        );
      } else {
        const today = new Date();
        const defaultExpiry = new Date(Date.now() + 3 * 86400000);

        if (initialValues) {
          setName(initialValues.name || '');
          setCategory(
            resolveScannedCategory(initialValues.category, availableCategories)
          );
          setQuantity(initialValues.quantity || '1');
          setUnit(
            UNITS.find(
              (availableUnit) =>
                availableUnit.toLowerCase() === initialValues.unit.toLowerCase()
            ) || 'Pack'
          );
        } else {
          setName('');
          setCategory(availableCategories[0] || 'Produce');
          setQuantity('1');
          setUnit('Pieces');
        }

        setPurchaseDate(formatDateToISO(today));
        setExpiryDate(formatDateToISO(defaultExpiry));
        setStorageLocation(availableLocations[0] || 'Fridge');
      }
    }
  }, [visible, itemToEdit, initialValues, availableCategories, availableLocations]);

  const handleSubmit = () => {
    setValidationError('');
    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Please enter a product name.');
      return;
    }

    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      setValidationError('Please enter a valid positive quantity.');
      return;
    }

    if (!purchaseDate.trim() || isNaN(new Date(purchaseDate).getTime())) {
      setValidationError('Please enter a valid purchase date (YYYY-MM-DD).');
      return;
    }

    if (!expiryDate.trim() || isNaN(new Date(expiryDate).getTime())) {
      setValidationError('Please enter a valid expiry date (YYYY-MM-DD).');
      return;
    }

    onSave({
      id: itemToEdit?.id,
      name: trimmedName,
      category,
      quantity: numQty,
      unit,
      purchaseDate: purchaseDate.trim(),
      expiryDate: expiryDate.trim(),
      storageLocation,
    });

    onClose();
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
              <Text style={styles.sheetTitle}>
                {itemToEdit ? 'Edit Inventory Item' : 'Add Item to Inventory'}
              </Text>
              <Text style={styles.sheetSubtitle}>
                Track freshness and manage your food inventory
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>âœ•</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
            {/* Product Name */}
            <Text style={styles.inputLabel}>Product Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Fresh Milk, Spinach, Chicken"
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />

            {/* Storage Location */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.inputLabel}>Storage Location *</Text>
              {onManageOptions && (
                <Pressable onPress={onManageOptions} hitSlop={6}>
                  <Text style={styles.manageLinkText}>âš™ Manage Locations</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.chipsRow}>
              {availableLocations.map((loc) => {
                const isSelected = storageLocation === loc;
                return (
                  <Pressable
                    key={loc}
                    onPress={() => setStorageLocation(loc)}
                    style={[styles.chip, isSelected && styles.chipActive]}>
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {loc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Category */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.inputLabel}>Category</Text>
              {onManageOptions && (
                <Pressable onPress={onManageOptions} hitSlop={6}>
                  <Text style={styles.manageLinkText}>âš™ Manage Categories</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.chipsRow}>
              {availableCategories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[styles.chip, isSelected && styles.chipActive]}>
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Quantity and Unit */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Quantity *</Text>
                <TextInput
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="1"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  style={styles.textInput}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Unit</Text>
            <View style={styles.chipsRow}>
              {UNITS.map((u) => {
                const isSelected = unit === u;
                return (
                  <Pressable
                    key={u}
                    onPress={() => setUnit(u)}
                    style={[styles.chip, isSelected && styles.chipActive]}>
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {u}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Purchase & Expiry Dates */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Purchase Date (YYYY-MM-DD)</Text>
                <TextInput
                  value={purchaseDate}
                  onChangeText={setPurchaseDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  style={styles.textInput}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Expiry Date * (YYYY-MM-DD)</Text>
                <TextInput
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Validation Error */}
            {validationError ? (
              <Text style={styles.errorText}>{validationError}</Text>
            ) : null}

            {/* Action Buttons */}
            <Pressable
              onPress={handleSubmit}
              disabled={isSaving}
              style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {itemToEdit ? 'Save Changes' : 'Save Item'}
                </Text>
              )}
            </Pressable>

            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </ScrollView>
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
    maxWidth: 500,
    maxHeight: '90%',
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
  },
  formScroll: {
    paddingBottom: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 10,
    marginBottom: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  manageLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  textInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    borderColor: '#16A34A',
    backgroundColor: '#DCFCE7',
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#15803D',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  saveBtn: {
    backgroundColor: '#16A34A',
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
