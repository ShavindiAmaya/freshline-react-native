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

type PackageAmount = {
    quantity: string;
    unit: string;
};

/**
 * Convert the package quantity returned by Open Food Facts into a quantity
 * and a unit supported by the Add Food form.
 */
const getPackageAmount = (value?: string): PackageAmount => {
    if (!value) return { quantity: '1', unit: 'Pack' };

    const match = value.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|pcs?|pieces?|pack)?/i);

    if (!match) return { quantity: '1', unit: 'Pack' };

    const rawUnit = (match[2] || 'pack').toLowerCase();
    let unit = 'Pack';

    if (rawUnit === 'kg') {
        unit = 'kg';
    } else if (rawUnit === 'g') {
        unit = 'g';
    } else if (rawUnit === 'ml') {
        unit = 'ml';
    } else if (rawUnit === 'l') {
        unit = 'L';
    } else if (['pc', 'pcs', 'piece', 'pieces'].includes(rawUnit)) {
        unit = 'Pieces';
    }

    return {
        quantity: match[1].replace(',', '.'),
        unit,
    };
};

/**
 * Normalize the unit to one of the options currently supported by
 * AddFoodModal. Unsupported or blank values use Pack as a safe fallback.
 */
const normalizeUnit = (value: string): string => {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'kg') return 'kg';
    if (normalized === 'g') return 'g';
    if (normalized === 'ml') return 'ml';
    if (normalized === 'l') return 'L';
    if (['pc', 'pcs', 'piece', 'pieces'].includes(normalized)) return 'Pieces';
    if (['pack', 'packs'].includes(normalized)) return 'Pack';

    return 'Pack';
};

export default function FoodScannerScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();

    const [hasScanned, setHasScanned] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [product, setProduct] = useState<Product | null>(null);

    const [isSearching, setIsSearching] = useState(false);

    const [foodName, setFoodName] = useState('');
    const [category, setCategory] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [unit, setUnit] = useState('Pieces');

    const [message, setMessage] = useState('');

    // Look up the scanned barcode in the Open Food Facts product database.
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
            setFoodName(foundProduct.product_name);
            setCategory(
                foundProduct.categories?.split(',')[0]?.trim() || 'Other'
            );

            const amount = getPackageAmount(foundProduct.quantity);
            setQuantity(amount.quantity);
            setUnit(amount.unit);

            setMessage(
                'Product details loaded. Check the details and continue to the Add Food form.'
            );
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

    // Reset the scanner and product fields to scan another item.
    const handleScanAgain = () => {
        setHasScanned(false);
        setBarcode('');
        setProduct(null);
        setFoodName('');
        setCategory('');
        setQuantity('1');
        setUnit('Pieces');
        setMessage('');
    };

    // Return the scanned details to the dashboard. The dashboard will open
    // AddFoodModal with these values, and the existing inventory service will
    // handle the actual Supabase insert after the user confirms the form.
    const handleContinueToAddFood = () => {
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

        router.replace({
            pathname: '/dashboard',
            params: {
                scanResultId: String(Date.now()),
                scannedName: cleanName,
                scannedCategory: cleanCategory,
                scannedQuantity: String(numericQuantity),
                scannedUnit: normalizeUnit(unit),
            },
        });
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

                {/* Editable product details */}
                {hasScanned && !isSearching && (
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Product Details</Text>

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
                                placeholder="Pieces, g, kg, ml, L, Pack"
                                style={[styles.input, styles.unitInput]}
                            />
                        </View>

                        {message ? (
                            <View style={styles.messageCard}>
                                <Text style={styles.messageText}>{message}</Text>
                            </View>
                        ) : null}

                        <Pressable
                            style={styles.primaryButton}
                            onPress={handleContinueToAddFood}
                        >
                            <Text style={styles.primaryButtonText}>
                                Continue to Add Food
                            </Text>
                        </Pressable>

                        <Text style={styles.helperText}>
                            You can enter the purchase date, expiry date and storage
                            location in the next form.
                        </Text>
                    </View>
                )}

                {message && !isSearching && !hasScanned ? (
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
    helperText: {
        color: '#647568',
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
        marginTop: 12,
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
