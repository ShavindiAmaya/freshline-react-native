import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { FoodItem, StorageLocation } from '@/types/food';
import {
  scanFoodItemWithAI,
  ScannedImageInput,
} from '@/features/scanner/services/scanner.service';

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

interface PhotoSlot {
  uri: string;
  base64: string;
  mimeType: string;
}

// Simple helper to match string options case-insensitively
function matchOption(options: string[], target: string | null | undefined): string | null {
  if (!target) return null;
  const cleanTarget = target.trim().toLowerCase();

  // 1. Exact match (case-insensitive)
  const exact = options.find((opt) => opt.trim().toLowerCase() === cleanTarget);
  if (exact) return exact;

  // 2. Partial match
  const partial = options.find(
    (opt) =>
      cleanTarget.includes(opt.trim().toLowerCase()) ||
      opt.trim().toLowerCase().includes(cleanTarget)
  );
  if (partial) return partial;

  return null;
}

// Helper to format date as YYYY-MM-DD
function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function AddFoodModal({
  visible,
  onClose,
  onSave,
  itemToEdit,
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

  // AI Food Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [photos, setPhotos] = useState<(PhotoSlot | null)[]>([null, null, null]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);

  // Pre-fill fields when opening in edit mode or set clean defaults for add
  useEffect(() => {
    if (visible) {
      setValidationError('');
      setShowScanner(false);
      setPhotos([null, null, null]);
      setScanError(null);
      setScanSuccess(null);
      setIsAnalyzing(false);

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
        setName('');
        setCategory(availableCategories[0] || 'Produce');
        setQuantity('1');
        setUnit('Pieces');
        setPurchaseDate(formatDateToISO(today));
        setExpiryDate(formatDateToISO(defaultExpiry));
        setStorageLocation(availableLocations[0] || 'Fridge');
      }
    }
  }, [visible, itemToEdit, availableCategories, availableLocations]);

  // Capture photo using Camera
  const handleCapturePhoto = async (index: number) => {
    setScanError(null);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setScanError('Camera permission is required to capture photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Data = asset.base64;
        if (base64Data) {
          setPhotos((prev) => {
            const next = [...prev];
            next[index] = {
              uri: asset.uri,
              base64: base64Data,
              mimeType: asset.mimeType || 'image/jpeg',
            };
            return next;
          });
        }
      }
    } catch (err: any) {
      setScanError('Could not capture photo: ' + (err?.message || 'Unknown error'));
    }
  };

  // Select photo from Gallery / Media Library
  const handlePickFromGallery = async (index: number) => {
    setScanError(null);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setScanError('Photo library permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Data = asset.base64;
        if (base64Data) {
          setPhotos((prev) => {
            const next = [...prev];
            next[index] = {
              uri: asset.uri,
              base64: base64Data,
              mimeType: asset.mimeType || 'image/jpeg',
            };
            return next;
          });
        }
      }
    } catch (err: any) {
      setScanError('Could not select photo: ' + (err?.message || 'Unknown error'));
    }
  };

  // Remove photo from a slot
  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  // Send images to Gemini Vision via Supabase Edge Function
  const handleAnalyzeProduct = async () => {
    setScanError(null);
    setScanSuccess(null);

    // Front photo (slot 0) is required
    if (!photos[0]) {
      setScanError('Please capture or select the product front photo first.');
      return;
    }

    const validPhotos: ScannedImageInput[] = photos
      .filter((p): p is PhotoSlot => p !== null && Boolean(p.base64))
      .map((p) => ({
        base64: p.base64,
        mimeType: p.mimeType,
      }));

    setIsAnalyzing(true);
    try {
      const result = await scanFoodItemWithAI(validPhotos);

      // 1. Populate Product Name
      if (result.name) {
        setName(result.name);
      }

      // 2. Match Category against user inventory options
      const matchedCat = matchOption(availableCategories, result.category);
      if (matchedCat) {
        setCategory(matchedCat);
      }

      // 3. Populate Quantity
      if (result.quantity && result.quantity > 0) {
        setQuantity(String(result.quantity));
      }

      // 4. Match Unit against UNITS list
      const matchedUnit = matchOption(UNITS, result.unit);
      if (matchedUnit) {
        setUnit(matchedUnit);
      }

      // 5. Purchase Date (default to today)
      setPurchaseDate(formatDateToISO(new Date()));

      // 6. Expiry Date
      let hasExpiry = false;
      if (result.expiryDate) {
        setExpiryDate(result.expiryDate);
        hasExpiry = true;
      }

      // 7. Match Storage Location against user inventory options
      const matchedLoc = matchOption(availableLocations, result.storageLocation);
      if (matchedLoc) {
        setStorageLocation(matchedLoc as StorageLocation);
      }

      if (hasExpiry) {
        setScanSuccess('Product recognized! Please verify details below and save.');
      } else {
        setScanSuccess(
          'Product recognized! (Expiry date could not be confirmed — please enter it manually below).'
        );
      }
    } catch (err: any) {
      setScanError(
        err?.message || 'Failed to analyze product. Please try again or enter details manually.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

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
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
            {/* AI Food Scanner Section */}
            {!itemToEdit && (
              <View style={styles.aiToggleWrapper}>
                <Pressable
                  onPress={() => setShowScanner((prev) => !prev)}
                  style={[
                    styles.aiToggleBtn,
                    showScanner && styles.aiToggleBtnActive,
                  ]}>
                  <Text
                    style={[
                      styles.aiToggleBtnText,
                      showScanner && styles.aiToggleBtnTextActive,
                    ]}>
                    {showScanner ? '✕ Close AI Scanner' : '✨ Scan with AI (Auto-Fill)'}
                  </Text>
                </Pressable>
              </View>
            )}

            {showScanner && !itemToEdit && (
              <View style={styles.scannerCard}>
                <View style={styles.scannerHeaderRow}>
                  <Text style={styles.scannerTitle}>AI Food Scanner</Text>
                  <Text style={styles.scannerSubtitle}>
                    Capture up to 3 photos to auto-fill product details
                  </Text>
                </View>

                {/* 3 Photo Slots */}
                <View style={styles.slotsRow}>
                  {[
                    { label: 'Front Image *', sub: 'Required' },
                    { label: 'Expiry Label', sub: 'Recommended' },
                    { label: 'Back / Details', sub: 'Optional' },
                  ].map((meta, idx) => {
                    const photo = photos[idx];
                    return (
                      <View key={idx} style={styles.slotItem}>
                        <Text style={styles.slotLabel} numberOfLines={1}>
                          {meta.label}
                        </Text>
                        <Text style={styles.slotSubLabel}>{meta.sub}</Text>

                        {photo ? (
                          <View style={styles.slotPreviewBox}>
                            <Image
                              source={{ uri: photo.uri }}
                              style={styles.slotPreviewImage}
                            />
                            <View style={styles.slotActionRow}>
                              <Pressable
                                onPress={() => handleCapturePhoto(idx)}
                                hitSlop={4}
                                style={styles.slotSmallBtn}>
                                <Text style={styles.slotSmallBtnText}>📷</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => handlePickFromGallery(idx)}
                                hitSlop={4}
                                style={styles.slotSmallBtn}>
                                <Text style={styles.slotSmallBtnText}>🖼️</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => handleRemovePhoto(idx)}
                                hitSlop={4}
                                style={[styles.slotSmallBtn, styles.slotRemoveBtn]}>
                                <Text style={styles.slotRemoveBtnText}>✕</Text>
                              </Pressable>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.slotEmptyBox}>
                            <Pressable
                              onPress={() => handleCapturePhoto(idx)}
                              style={styles.slotPickBtn}>
                              <Text style={styles.slotPickBtnText}>📷 Camera</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => handlePickFromGallery(idx)}
                              style={[styles.slotPickBtn, styles.slotPickGalleryBtn]}>
                              <Text style={styles.slotPickGalleryBtnText}>🖼️ Gallery</Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Feedback notices */}
                {scanError ? (
                  <View style={styles.scanNoticeBoxError}>
                    <Text style={styles.scanNoticeTextError}>⚠️ {scanError}</Text>
                  </View>
                ) : null}

                {scanSuccess ? (
                  <View style={styles.scanNoticeBoxSuccess}>
                    <Text style={styles.scanNoticeTextSuccess}>{scanSuccess}</Text>
                  </View>
                ) : null}

                {/* Analyze Button */}
                <Pressable
                  onPress={handleAnalyzeProduct}
                  disabled={isAnalyzing || !photos[0]}
                  style={[
                    styles.analyzeBtn,
                    (!photos[0] || isAnalyzing) && styles.analyzeBtnDisabled,
                  ]}>
                  {isAnalyzing ? (
                    <View style={styles.analyzeBtnLoadingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.analyzeBtnText}>Analyzing with Gemini AI...</Text>
                    </View>
                  ) : (
                    <Text style={styles.analyzeBtnText}>🔍 Analyze Product</Text>
                  )}
                </Pressable>
              </View>
            )}

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
                  <Text style={styles.manageLinkText}>⚙ Manage Locations</Text>
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
                  <Text style={styles.manageLinkText}>⚙ Manage Categories</Text>
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
  aiToggleWrapper: {
    marginBottom: 10,
  },
  aiToggleBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiToggleBtnActive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  aiToggleBtnText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
  aiToggleBtnTextActive: {
    color: '#64748B',
  },
  scannerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    marginBottom: 12,
  },
  scannerHeaderRow: {
    marginBottom: 10,
  },
  scannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  scannerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  slotItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    alignItems: 'center',
  },
  slotLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  slotSubLabel: {
    fontSize: 9,
    color: '#94A3B8',
    marginBottom: 6,
    textAlign: 'center',
  },
  slotPreviewBox: {
    width: '100%',
    height: 74,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  slotPreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    resizeMode: 'cover',
  },
  slotActionRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 3,
  },
  slotSmallBtn: {
    paddingHorizontal: 4,
  },
  slotSmallBtnText: {
    fontSize: 11,
  },
  slotRemoveBtn: {},
  slotRemoveBtnText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  slotEmptyBox: {
    width: '100%',
    height: 74,
    justifyContent: 'center',
    gap: 4,
  },
  slotPickBtn: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 4,
    alignItems: 'center',
  },
  slotPickBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  slotPickGalleryBtn: {
    backgroundColor: '#F1F5F9',
  },
  slotPickGalleryBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  scanNoticeBoxError: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  scanNoticeTextError: {
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '600',
  },
  scanNoticeBoxSuccess: {
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  scanNoticeTextSuccess: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
  },
  analyzeBtn: {
    backgroundColor: '#16A34A',
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.8,
  },
  analyzeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  analyzeBtnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
