
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import type { StorageLocation } from '@/types/food';

type Product = {
    code?: string;
    product_name?: string;
    brands?: string;
    categories?: string;
    quantity?: string;
    image_front_url?: string;
};

type ProductResponse = {
    product?: Product;
};

const getToday = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const isValidDate = (value: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) return false;

    const [, year, month, day] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    return (
        date.getFullYear() === Number(year) &&
        date.getMonth() === Number(month) - 1 &&
        date.getDate() === Number(day)
    );
};

const getPackageAmount = (value?: string) => {
    if (!value) return { quantity: '1', unit: 'pack' };

    const match = value.match(
        /(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|pcs?)?/i
    );

    if (!match) return { quantity: '1', unit: 'pack' };

    const unit = (match[2] || 'pack').toLowerCase();

    return {
        quantity: match[1].replace(',', '.'),
        unit: unit === 'pc' ? 'pcs' : unit,
    };
};

export default function FoodScannerScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();

    const [hasScanned, setHasScanned] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [product, setProduct] = useState<Product | null>(null);

    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [foodName, setFoodName] = useState('');
    const [category, setCategory] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [unit, setUnit] = useState('pcs');
    const [purchaseDate, setPurchaseDate] = useState(getToday());
    const [expiryDate, setExpiryDate] = useState('');
    const [storageLocation, setStorageLocation] =
        useState<StorageLocation>('Fridge');

    const [message, setMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    // Search Open Food Facts using the scanned barcode.
    const lookupProduct = async (code: string) => {
        setIsSearching(true);
        setMessage('');
        setProduct(null);

        try {
            const url =
                `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(code)}` +
                '?fields=code,product_name,brands,categories,quantity,image_front_url';

            const response = await fetch(url, {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Product database is unavailable.');
            }

            const result = (await response.json()) as ProductResponse;
            const foundProduct = result.product;

            if (!foundProduct?.product_name) {
                setMessage(
                    'Product not found. Please enter the food details manually.'
                );
                return;
            }

            setProduct(foundProduct);
            setFoodName(foundProduct.product_name || '');

            setCategory(
                foundProduct.categories?.split(',')[0]?.trim() || 'Other'
            );

            const amount = getPackageAmount(foundProduct.quantity);

            setQuantity(amount.quantity);
            setUnit(amount.unit);

            setMessage('Product details loaded. Please check and complete the form.');
        } catch (error) {
            console.error('Product lookup failed:', error);

            setMessage(
                'Could not retrieve product details. You can enter them manually.'
            );
        } finally {
            setIsSearching(false);
        }
    };

    // Handle a QR code or barcode scan.
    const handleBarcodeScanned = ({ data }: { data: string }) => {
        if (hasScanned) return;

        setHasScanned(true);
        setBarcode(data);
        setMessage('');

        if (!/^\d{8,14}$/.test(data)) {
            setMessage(
                'QR content captured. Enter the product details manually if it is not a standard product barcode.'
            );
            return;
        }

        void lookupProduct(data);
    };

    // Reset the scanner and form for another product.
    const handleScanAgain = () => {
        setHasScanned(false);
        setBarcode('');
        setProduct(null);

        setFoodName('');
        setCategory('');
        setQuantity('1');
        setUnit('pcs');
        setPurchaseDate(getToday());
        setExpiryDate('');
        setStorageLocation('Fridge');

        setMessage('');
        setSuccessMessage('');
        setIsSaved(false);
    };

    // Save the food item to the signed-in user's Supabase inventory.
    const handleSaveToInventory = async () => {
        if (isSaving || isSaved) return;

        const cleanName = foodName.trim();
        const cleanCategory = category.trim();
        const numericQuantity = Number(quantity);

        if (!cleanName) {
            setMessage('Please enter a food name.');
            return;
        }

        if (!cleanCategory) {
            setMessage('Please enter a food category.');
            return;
        }

        if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
            setMessage('Please enter a valid quantity greater than zero.');
            return;
        }

        if (!unit.trim()) {
            setMessage('Please enter a unit.');
            return;
        }

        if (!isValidDate(purchaseDate)) {
            setMessage('Enter a valid purchase date using YYYY-MM-DD.');
            return;
        }

        if (!isValidDate(expiryDate)) {
            setMessage('Enter a valid expiry date using YYYY-MM-DD.');
            return;
        }

        if (purchaseDate > expiryDate) {
            setMessage('Expiry date cannot be earlier than purchase date.');
            return;
        }

        setIsSaving(true);
        setMessage('');
        setSuccessMessage('');

        try {
            // Get the currently authenticated user.
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError) throw authError;

            if (!user) {
                throw new Error('Please sign in before adding food to your inventory.');
            }

            // Database uses snake_case column names.
            // id and created_at are generated by PostgreSQL.
            const { error: insertError } = await supabase
                .from('food_items')
                .insert({
                    user_id: user.id,
                    name: cleanName,
                    category: cleanCategory,
                    quantity: numericQuantity,
                    unit: unit.trim(),
                    purchase_date: purchaseDate,
                    expiry_date: expiryDate,
                    storage_location: storageLocation,
                });

            if (insertError) throw insertError;

            setIsSaved(true);
            setSuccessMessage(
                `${cleanName} was successfully added to your inventory!`
            );
        } catch (error) {
            console.error('Failed to save food item:', error);

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Unable to save this food item. Please try again.';

            setMessage(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    if (!permission) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#16834A" />
                <Text style={styles.infoText}>Checking camera permission...</Text>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.centered}>
                <Text style={styles.permissionIcon}>📷</Text>
                <Text style={styles.title}>Camera Permission Required</Text>

                <Text style={styles.infoText}>
                    FreshLine needs camera access to scan food QR codes and barcodes.
                </Text>

                <Pressable
                    style={styles.primaryButton}
                    onPress={() => void requestPermission()}
                >
                    <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
                </Pressable>

                <Pressable onPress={() => router.back()}>
                    <Text style={styles.backText}>Go Back</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </Pressable>

                <Text style={styles.title}>Scan & Add Food</Text>

                <Text style={styles.subtitle}>
                    Scan a food package barcode to retrieve its product details.
                </Text>

                {/* Camera */}
                <View style={styles.cameraContainer}>
                    {!hasScanned ? (
                        <CameraView
                            style={styles.camera}
                            facing="back"
                            barcodeScannerSettings={{
                                barcodeTypes: [
                                    'qr',
                                    'ean13',
                                    'ean8',
                                    'upc_a',
                                    'upc_e',
                                    'code128',
                                    'datamatrix',
                                ],
                            }}
                            onBarcodeScanned={handleBarcodeScanned}
                        />
                    ) : (
                        <View style={styles.scannedOverlay}>
                            <Text style={styles.scannedIcon}>✓</Text>
                            <Text style={styles.scannedText}>Code Scanned</Text>
                            <Text style={styles.barcodeText}>{barcode}</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.scanHint}>
                    Position the code inside the camera view.
                </Text>

                {isSearching && (
                    <View style={styles.resultCard}>
                        <ActivityIndicator size="large" color="#16834A" />
                        <Text style={styles.loadingText}>
                            Searching product database...
                        </Text>
                    </View>
                )}

                {/* Product preview */}
                {product && (
                    <View style={styles.resultCard}>
                        <Text style={styles.resultHeading}>Product Found!</Text>

                        {product.image_front_url ? (
                            <Image
                                source={{ uri: product.image_front_url }}
                                style={styles.productImage}
                                resizeMode="contain"
                            />
                        ) : null}

                        <Text style={styles.productName}>
                            {product.product_name}
                        </Text>

                        {product.brands ? (
                            <Text style={styles.productDetail}>
                                Brand: {product.brands}
                            </Text>
                        ) : null}

                        {product.quantity ? (
                            <Text style={styles.productDetail}>
                                Package size: {product.quantity}
                            </Text>
                        ) : null}
                    </View>
                )}

                {/* Editable product form */}
                {hasScanned && !isSearching && !isSaved && (
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Food Details</Text>

                        <Text style={styles.label}>Food Name *</Text>
                        <TextInput
                            value={foodName}
                            onChangeText={setFoodName}
                            placeholder="Example: Fresh Milk"
                            style={styles.input}
                        />

                        <Text style={styles.label}>Category *</Text>
                        <TextInput
                            value={category}
                            onChangeText={setCategory}
                            placeholder="Example: Dairy"
                            style={styles.input}
                        />

                        <Text style={styles.label}>Quantity *</Text>
                        <View style={styles.quantityRow}>
                            <TextInput
                                value={quantity}
                                onChangeText={setQuantity}
                                keyboardType="decimal-pad"
                                placeholder="1"
                                style={[styles.input, styles.quantityInput]}
                            />

                            <TextInput
                                value={unit}
                                onChangeText={setUnit}
                                placeholder="g, kg, ml, pcs..."
                                style={[styles.input, styles.unitInput]}
                            />
                        </View>

                        <Text style={styles.label}>Purchase Date * (YYYY-MM-DD)</Text>
                        <TextInput
                            value={purchaseDate}
                            onChangeText={setPurchaseDate}
                            placeholder="2026-11-16"
                            style={styles.input}
                            autoCapitalize="none"
                        />

                        <Text style={styles.label}>Expiry Date * (YYYY-MM-DD)</Text>
                        <TextInput
                            value={expiryDate}
                            onChangeText={setExpiryDate}
                            placeholder="2026-11-25"
                            style={styles.input}
                            autoCapitalize="none"
                        />

                        <Text style={styles.label}>Storage Location *</Text>

                        <View style={styles.locationRow}>
                            {(['Fridge', 'Freezer', 'Pantry'] as const).map((location) => (
                                <Pressable
                                    key={location}
                                    onPress={() => setStorageLocation(location)}
                                    style={[
                                        styles.locationButton,
                                        storageLocation === location && styles.locationSelected,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.locationText,
                                            storageLocation === location && styles.locationTextSelected,
                                        ]}
                                    >
                                        {location}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        {message ? (
                            <View style={styles.messageCard}>
                                <Text style={styles.messageText}>{message}</Text>
                            </View>
                        ) : null}

                        <Pressable
                            style={[
                                styles.primaryButton,
                                isSaving && styles.disabledButton,
                            ]}
                            disabled={isSaving}
                            onPress={() => void handleSaveToInventory()}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.primaryButtonText}>
                                    Add to Inventory
                                </Text>
                            )}
                        </Pressable>
                    </View>
                )}

                {/* Saved successfully */}
                {isSaved && (
                    <View style={styles.successCard}>
                        <Text style={styles.successIcon}>✓</Text>
                        <Text style={styles.successTitle}>Successfully Saved!</Text>
                        <Text style={styles.successText}>{successMessage}</Text>

                        <Text style={styles.savedDetails}>
                            Your food item is now stored in your Supabase account.
                        </Text>

                        <Pressable
                            style={styles.primaryButton}
                            onPress={() => router.replace('/dashboard')}
                        >
                            <Text style={styles.primaryButtonText}>
                                Back to Dashboard
                            </Text>
                        </Pressable>
                    </View>
                )}

                {message && !isSearching && !isSaved && !hasScanned ? (
                    <View style={styles.messageCard}>
                        <Text style={styles.messageText}>{message}</Text>
                    </View>
                ) : null}

                {hasScanned && !isSearching && (
                    <Pressable style={styles.secondaryButton} onPress={handleScanAgain}>
                        <Text style={styles.secondaryButtonText}>
                            Scan Another Product
                        </Text>
                    </Pressable>
                )}

                <Text style={styles.footerText}>
                    Product information powered by Open Food Facts
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F4F8F4',
    },
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#F4F8F4',
    },
    backButton: {
        alignSelf: 'flex-start',
        paddingVertical: 10,
        marginBottom: 12,
    },
    backText: {
        color: '#16834A',
        fontSize: 15,
        fontWeight: '700',
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#153D28',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#647568',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 22,
    },
    cameraContainer: {
        height: 320,
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#17251C',
    },
    camera: {
        flex: 1,
    },
    scannedOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    scannedIcon: {
        color: '#75D69B',
        fontSize: 54,
        fontWeight: '800',
    },
    scannedText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
        marginTop: 10,
    },
    barcodeText: {
        color: '#D8E8DC',
        fontSize: 13,
        marginTop: 8,
        textAlign: 'center',
    },
    scanHint: {
        color: '#647568',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 18,
    },
    resultCard: {
        backgroundColor: '#FFFFFF',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#DCE9DF',
    },
    resultHeading: {
        color: '#16834A',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 14,
    },
    productImage: {
        width: 130,
        height: 130,
        marginBottom: 12,
    },
    productName: {
        color: '#153D28',
        fontSize: 19,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    productDetail: {
        color: '#647568',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 5,
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#DCE9DF',
        marginTop: 4,
    },
    formTitle: {
        color: '#153D28',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 18,
    },
    label: {
        color: '#334B3B',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 7,
        marginTop: 12,
    },
    input: {
        width: '100%',
        minHeight: 46,
        backgroundColor: '#F8FAF8',
        borderWidth: 1,
        borderColor: '#DCE9DF',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#153D28',
        fontSize: 14,
    },
    quantityRow: {
        flexDirection: 'row',
        gap: 10,
    },
    quantityInput: {
        flex: 1,
    },
    unitInput: {
        flex: 1,
    },
    locationRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 3,
    },
    locationButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#DCE9DF',
        backgroundColor: '#F8FAF8',
        borderRadius: 9,
        paddingVertical: 12,
        alignItems: 'center',
    },
    locationSelected: {
        backgroundColor: '#16834A',
        borderColor: '#16834A',
    },
    locationText: {
        color: '#52685A',
        fontSize: 12,
        fontWeight: '700',
    },
    locationTextSelected: {
        color: '#FFFFFF',
    },
    messageCard: {
        backgroundColor: '#FFF8E7',
        borderRadius: 10,
        padding: 12,
        marginTop: 14,
    },
    messageText: {
        color: '#8A6418',
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
    },
    primaryButton: {
        backgroundColor: '#16834A',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 18,
        width: '100%',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
    disabledButton: {
        opacity: 0.6,
    },
    secondaryButton: {
        borderWidth: 1,
        borderColor: '#16834A',
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 14,
    },
    secondaryButtonText: {
        color: '#16834A',
        fontWeight: '800',
        fontSize: 14,
    },
    loadingText: {
        color: '#647568',
        fontSize: 13,
        marginTop: 12,
    },
    successCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#B8E5C7',
        borderRadius: 16,
        padding: 22,
        marginTop: 12,
        alignItems: 'center',
    },
    successIcon: {
        fontSize: 48,
        fontWeight: '800',
        color: '#16834A',
    },
    successTitle: {
        fontSize: 21,
        fontWeight: '800',
        color: '#153D28',
        marginTop: 8,
    },
    successText: {
        color: '#16834A',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 21,
    },
    savedDetails: {
        color: '#647568',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 10,
    },
    permissionIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    infoText: {
        color: '#647568',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 21,
        marginVertical: 14,
    },
    footerText: {
        color: '#94A39A',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 22,
    },
});
