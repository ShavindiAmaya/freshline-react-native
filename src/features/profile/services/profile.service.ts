import { supabase } from '@/lib/supabase';

export type DietaryPreference =
  | 'not_set'
  | 'vegetarian'
  | 'non_vegetarian'
  | 'vegan';

export interface ProfilePreferences {
  dietary_preference?: DietaryPreference | string;
  allergies?: string[];
  disliked_ingredients?: string[];
  favorite_cuisines?: string[];
}

// Get logged-in user profile
export async function getProfile() {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('Error getting auth user in getProfile:', authError);
    throw authError;
  }

  const user = authData.user;
  if (!user) {
    throw new Error('User not logged in');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile from Supabase:', error);
    throw error;
  }

  return data;
}

// Update food preferences with dynamic values using .update()
export async function updateProfile(preferences: ProfilePreferences) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('Error getting auth user in updateProfile:', authError);
    throw authError;
  }

  const user = authData.user;
  if (!user) {
    throw new Error('User not logged in');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      dietary_preference: preferences.dietary_preference,
      allergies: preferences.allergies,
      disliked_ingredients: preferences.disliked_ingredients,
      favorite_cuisines: preferences.favorite_cuisines,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile in Supabase:', error);
    throw error;
  }

  return data;
}

// Update user display name using .update()
export async function updateDisplayName(displayName: string) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('Error getting auth user in updateDisplayName:', authError);
    throw authError;
  }

  const user = authData.user;
  if (!user) {
    throw new Error('User not logged in');
  }

  // Update Supabase auth user metadata
  await supabase.auth.updateUser({
    data: {
      display_name: displayName,
      full_name: displayName,
    },
  });

  // Update database profile
  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating display name in Supabase:', error);
    throw error;
  }

  return data;
}

// Upload profile image to Supabase storage and save URL using .update()
export async function uploadAvatar(file: any, fileExt = 'png') {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('Error getting auth user in uploadAvatar:', authError);
    throw authError;
  }

  const user = authData.user;
  if (!user) {
    throw new Error('User not logged in');
  }

  let avatarUrl = '';

  if (typeof file === 'string') {
    avatarUrl = file;
  } else {
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Storage upload error in uploadAvatar:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    avatarUrl = data.publicUrl;
  }

  // Save avatar_url in profiles table
  const { data, error } = await supabase
    .from('profiles')
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating avatar_url in Supabase:', error);
    throw error;
  }

  return avatarUrl;
}
