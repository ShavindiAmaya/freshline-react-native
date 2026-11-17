import { supabase } from '@/lib/supabase';

export interface ScannedImageInput {
  base64: string;
  mimeType: string;
}

export interface ScannedProductResult {
  name: string;
  category: string | null;
  quantity: number;
  unit: string;
  expiryDate: string | null;
  storageLocation: string | null;
}


//  Sends food product images to the Supabase Edge Function 'scan-food-item'

export async function scanFoodItemWithAI(
  images: ScannedImageInput[]
): Promise<ScannedProductResult> {
  if (!images || images.length === 0) {
    throw new Error('Please provide at least one product photo.');
  }

  const { data, error } = await supabase.functions.invoke('scan-food-item', {
    body: { images },
  });

  if (error) {
    console.error('Function Error:', error.message);

    if (error.context) {
      const response = error.context;

      console.log('HTTP Status:', response.status);

      const errorBody = await response.text();
      console.log('Error Details:', errorBody);
    }

    throw error;
  }

  if (!data || !data.success || !data.data) {
    throw new Error(data?.error || 'AI could not detect product information.');
  }

  return data.data as ScannedProductResult;
}
