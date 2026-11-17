// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: User is not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Read Gemini API Key from Edge Function secrets
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY secret is not set in Supabase Edge Functions. Please configure it.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse input body
    const { images } = await req.json();
    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one product image is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Prepare image parts for Gemini Vision API
    const parts: any[] = [];
    for (const img of images) {
      if (img && img.base64) {
        const cleanBase64 = img.base64.replace(/^data:image\/[a-z]+;base64,/, '');
        parts.push({
          inline_data: {
            mime_type: img.mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }
    }

    if (parts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid image data provided.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Instruction prompt for structured product information extraction
    const promptText = `You are an expert food item analyzer for a kitchen inventory tracking app.
Analyze the provided image(s) of a food product. Images may include:
- Product front image (packaging, brand, name)
- Expiry date label / stamp / print
- Nutrition label or quantity / weight info

Extract these details accurately:
1. name: Clean, recognizable food product name (e.g., "Full Cream Milk", "Greek Yogurt", "Eggs", "Cheddar Cheese", "Tomatoes").
2. category: Standard grocery category (e.g., "Dairy", "Produce", "Meat", "Pantry", "Bakery", "Beverages", "Frozen", "Snacks").
3. quantity: Numeric value for the amount or package count (e.g., 1, 2, 500). If unclear, default to 1.
4. unit: Measurement unit (e.g., "Piece", "Pack", "kg", "g", "L", "ml"). If unclear, default to "Piece" or "Pack".
5. expiryDate: The printed expiration/best-before/use-by date in strictly "YYYY-MM-DD" format.
   IMPORTANT RULES FOR EXPIRY DATE:
   - NEVER invent or guess an expiry date.
   - If the date is not clearly visible, readable, or is ambiguous, return null.
   - If only month and year are printed (e.g. 12/2026), format as the last day of the month (e.g. "2026-12-31").
   - If no expiry date is visible, return null.
6. storageLocation: Best storage location: "fridge", "freezer", or "pantry". If not obvious, return null.

Return ONLY a valid JSON object matching this structure (no markdown fences, no extra text):
{
  "name": "Product Name",
  "category": "Dairy",
  "quantity": 1,
  "unit": "L",
  "expiryDate": "2026-11-25",
  "storageLocation": "fridge"
}`;

    parts.push({ text: promptText });

    const geminiPayload = {
      contents: [
        {
          role: 'user',
          parts: parts,
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.1,
      },
    };

    // 6. Call Gemini API using gemini-3.5-flash-lite
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    let geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiRes.ok) {
      console.warn('gemini-3.5-flash-lite request failed, trying fallback...');
      geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload),
        }
      );
    }

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API call failed:', errText);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze images with Gemini Vision API.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiJson = await geminiRes.json();
    const candidateText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return new Response(
        JSON.stringify({ error: 'No content returned from Gemini model.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean JSON response if enclosed in markdown code blocks
    let cleanedJsonText = candidateText.trim();
    if (cleanedJsonText.startsWith('```json')) {
      cleanedJsonText = cleanedJsonText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanedJsonText.startsWith('```')) {
      cleanedJsonText = cleanedJsonText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanedJsonText);
    } catch (_e) {
      console.error('Failed to parse Gemini response as JSON:', candidateText);
      return new Response(
        JSON.stringify({ error: 'Could not parse product data from AI response.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Validate and sanitize extracted fields
    const validatedData = {
      name: typeof parsedResult.name === 'string' && parsedResult.name.trim() !== ''
        ? parsedResult.name.trim()
        : 'Scanned Food Item',
      category: typeof parsedResult.category === 'string' && parsedResult.category.trim() !== ''
        ? parsedResult.category.trim()
        : null,
      quantity: typeof parsedResult.quantity === 'number' && parsedResult.quantity > 0
        ? parsedResult.quantity
        : 1,
      unit: typeof parsedResult.unit === 'string' && parsedResult.unit.trim() !== ''
        ? parsedResult.unit.trim()
        : 'Piece',
      expiryDate: typeof parsedResult.expiryDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsedResult.expiryDate.trim())
        ? parsedResult.expiryDate.trim()
        : null,
      storageLocation: typeof parsedResult.storageLocation === 'string' && parsedResult.storageLocation.trim() !== ''
        ? parsedResult.storageLocation.trim().toLowerCase()
        : null,
    };

    return new Response(
      JSON.stringify({ success: true, data: validatedData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Unexpected error in scan-food-item:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
