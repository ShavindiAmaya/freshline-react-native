import { supabase } from '@/lib/supabase';

export interface InventoryOption {
  id: string;
  userId: string;
  optionType: 'category' | 'storage_location';
  name: string;
}

export interface InventoryOptionsGrouped {
  categories: InventoryOption[];
  storageLocations: InventoryOption[];
}

const DEFAULT_LOCATIONS = ['Fridge', 'Pantry', 'Freezer'];
const DEFAULT_CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat',
  'Bakery',
  'Pantry',
  'Beverages',
  'Other',
];

function mapOptionRow(row: any): InventoryOption {
  return {
    id: row.id,
    userId: row.user_id,
    optionType: row.option_type,
    name: row.name,
  };
}

// 1. Fetch user's categories and storage locations (seeds defaults if none exist)
export async function getInventoryOptions(): Promise<InventoryOptionsGrouped> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('getInventoryOptions auth error:', authError);
      throw new Error('You must be logged in to view inventory options.');
    }

    const { data, error } = await supabase
      .from('inventory_options')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('getInventoryOptions Supabase error:', error.message, error.code);
      throw new Error(error.message || 'Failed to fetch inventory options.');
    }

    let options = data || [];

    // If user has no options yet, seed default options in Supabase
    if (options.length === 0) {
      const seedRows = [
        ...DEFAULT_LOCATIONS.map((loc) => ({
          user_id: user.id,
          option_type: 'storage_location',
          name: loc,
        })),
        ...DEFAULT_CATEGORIES.map((cat) => ({
          user_id: user.id,
          option_type: 'category',
          name: cat,
        })),
      ];

      const { data: seeded, error: seedError } = await supabase
        .from('inventory_options')
        .insert(seedRows)
        .select();

      if (!seedError && seeded && seeded.length > 0) {
        options = seeded;
      }
    }

    const categories: InventoryOption[] = [];
    const storageLocations: InventoryOption[] = [];

    options.forEach((row) => {
      const mapped = mapOptionRow(row);
      if (mapped.optionType === 'category') {
        categories.push(mapped);
      } else if (mapped.optionType === 'storage_location') {
        storageLocations.push(mapped);
      }
    });

    return { categories, storageLocations };
  } catch (err: any) {
    console.error('getInventoryOptions error:', err.message);
    throw err;
  }
}

// 2. Add a new category or storage location
export async function addInventoryOption(
  optionType: 'category' | 'storage_location',
  name: string
): Promise<InventoryOption> {
  try {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Option name cannot be empty.');
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('addInventoryOption auth error:', authError);
      throw new Error('You must be logged in to add options.');
    }

    // Check duplicate (case-insensitive) for this user and optionType
    const { data: existing, error: dupError } = await supabase
      .from('inventory_options')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('option_type', optionType)
      .ilike('name', trimmed);

    if (dupError) {
      console.error('Check duplicate error:', dupError.message);
    }

    if (existing && existing.length > 0) {
      throw new Error(
        `"${trimmed}" already exists in ${
          optionType === 'category' ? 'Categories' : 'Storage Locations'
        }.`
      );
    }

    const { data, error } = await supabase
      .from('inventory_options')
      .insert({
        user_id: user.id,
        option_type: optionType,
        name: trimmed,
      })
      .select()
      .single();

    if (error) {
      console.error('addInventoryOption Supabase error:', error.message, error.code);
      throw new Error(error.message || 'Failed to add option.');
    }

    return mapOptionRow(data);
  } catch (err: any) {
    console.error('addInventoryOption error:', err.message);
    throw err;
  }
}

// 3. Rename an existing option
export async function updateInventoryOption(
  id: string,
  name: string
): Promise<InventoryOption> {
  try {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Option name cannot be empty.');
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('updateInventoryOption auth error:', authError);
      throw new Error('You must be logged in to update options.');
    }

    // Fetch existing option
    const { data: currentOpt, error: optError } = await supabase
      .from('inventory_options')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (optError || !currentOpt) {
      throw new Error('Option not found.');
    }

    if (currentOpt.name.toLowerCase() === trimmed.toLowerCase()) {
      return mapOptionRow(currentOpt);
    }

    // Check if duplicate name exists for this user and option_type
    const { data: duplicate } = await supabase
      .from('inventory_options')
      .select('id')
      .eq('user_id', user.id)
      .eq('option_type', currentOpt.option_type)
      .ilike('name', trimmed)
      .neq('id', id);

    if (duplicate && duplicate.length > 0) {
      throw new Error(`An option named "${trimmed}" already exists.`);
    }

    // Check whether it is currently used by any food items
    const column =
      currentOpt.option_type === 'category' ? 'category' : 'storage_location';
    const { data: usedItems, error: usedError } = await supabase
      .from('food_items')
      .select('id')
      .eq('user_id', user.id)
      .eq(column, currentOpt.name);

    if (usedError) {
      console.error('Check used items error:', usedError.message);
    }

    if (usedItems && usedItems.length > 0) {
      throw new Error(
        `Cannot rename "${currentOpt.name}" because it is currently used by ${usedItems.length} food item(s). Please update or delete those items first.`
      );
    }

    const { data, error } = await supabase
      .from('inventory_options')
      .update({ name: trimmed })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('updateInventoryOption Supabase error:', error.message, error.code);
      throw new Error(error.message || 'Failed to update option.');
    }

    return mapOptionRow(data);
  } catch (err: any) {
    console.error('updateInventoryOption error:', err.message);
    throw err;
  }
}

// 4. Delete an existing option
export async function deleteInventoryOption(id: string): Promise<void> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('deleteInventoryOption auth error:', authError);
      throw new Error('You must be logged in to delete options.');
    }

    // Fetch existing option
    const { data: currentOpt, error: optError } = await supabase
      .from('inventory_options')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (optError || !currentOpt) {
      throw new Error('Option not found.');
    }

    // Check whether it is currently used by any food items
    const column =
      currentOpt.option_type === 'category' ? 'category' : 'storage_location';
    const { data: usedItems, error: usedError } = await supabase
      .from('food_items')
      .select('id')
      .eq('user_id', user.id)
      .eq(column, currentOpt.name);

    if (usedError) {
      console.error('Check used items error:', usedError.message);
    }

    if (usedItems && usedItems.length > 0) {
      throw new Error(
        `Cannot delete "${currentOpt.name}" because it is currently used by ${usedItems.length} food item(s). Please update or delete those items first.`
      );
    }

    const { error } = await supabase
      .from('inventory_options')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('deleteInventoryOption Supabase error:', error.message, error.code);
      throw new Error(error.message || 'Failed to delete option.');
    }
  } catch (err: any) {
    console.error('deleteInventoryOption error:', err.message);
    throw err;
  }
}
