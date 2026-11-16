import { supabase } from '@/lib/supabase';

export interface ProfilePreferences {
  dietary_preference?: string;
  allergies?: string[];
  disliked_ingredients?: string[];
  favorite_cuisines?: string[];
}

// Get logged-in user profile
export async function getProfile() {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) throw authError;

  const user = authData.user;
  if (!user) {
    throw new Error('User not logged in');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

// Update food preferences with dynamic values
export async function updateProfile(preferences: ProfilePreferences) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) throw authError;

  const user = authData.user;
  if (!user) {
    throw new Error('User not logged in');
  }

  const updatePayload = {
    dietary_preference: preferences.dietary_preference,
    allergies: preferences.allergies,
    disliked_ingredients: preferences.disliked_ingredients,
    favorite_cuisines: preferences.favorite_cuisines,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id)
    .select()
    .maybeSingle();

  if (!data) {
    const { data: insertedData, error: insertError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updatePayload })
      .select()
      .single();

    if (insertError) throw insertError;
    return insertedData;
  }

  if (error) throw error;
  return data;
}

// Update user display name
export async function updateDisplayName(displayName: string) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) throw authError;

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
    .maybeSingle();

  if (!data) {
    const { data: insertedData, error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return insertedData;
  }

  if (error) throw error;
  return data;
}

// Upload profile image to Supabase storage and save URL
export async function uploadAvatar(file: any, fileExt = 'png') {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) throw authError;

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
      console.log('Storage upload error:', uploadError.message);
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
    .maybeSingle();

  if (!data) {
    const { data: insertedData, error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return insertedData;
  }

  if (error) throw error;
  return avatarUrl;
}
