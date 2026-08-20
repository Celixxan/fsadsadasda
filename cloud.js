let supabaseClient = null;
let currentUser = null;

function createUploadToken() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(12);
  globalThis.crypto?.getRandomValues?.(bytes);
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("") || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getConfig() {
  return window.VERDENSBORDET_CONFIG ?? {};
}

export function isCloudConfigured() {
  const config = getConfig();
  return Boolean(config.supabaseUrl && config.supabasePublishableKey);
}

export async function initCloud() {
  if (!isCloudConfigured()) return { configured: false, user: null };
  if (!supabaseClient) {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.8/+esm");
    const config = getConfig();
    supabaseClient = createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session?.user ?? null;
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    window.dispatchEvent(new CustomEvent("verdensbordet:auth", { detail: { user: currentUser } }));
  });
  return { configured: true, user: currentUser };
}

export function getCloudUser() {
  return currentUser;
}

export async function sendMagicLink(email) {
  await initCloud();
  const redirectTo = `${location.origin}${location.pathname}`;
  const { error } = await supabaseClient.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
  if (error) throw error;
}

export async function signOutCloud() {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
  currentUser = null;
}

async function ensureJourney() {
  if (!currentUser) throw new Error("Du må være logget inn");
  const { data: existing, error: readError } = await supabaseClient
    .from("journeys")
    .select("id")
    .eq("owner_id", currentUser.id)
    .limit(1)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) return existing.id;
  const { data, error } = await supabaseClient
    .from("journeys")
    .insert({ owner_id: currentUser.id, title: "Verdensbordet", cadence: "weekly" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function uploadDataUrl(dataUrl, entryId, index) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const extension = blob.type.includes("png") ? "png" : "jpg";
  const path = `${currentUser.id}/${entryId}/${index}-${createUploadToken()}.${extension}`;
  const { error } = await supabaseClient.storage.from("meal-photos").upload(path, blob, {
    contentType: blob.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function syncEntryToCloud(entry) {
  await initCloud();
  if (!currentUser) return { synced: false, reason: "not-authenticated" };
  const journeyId = await ensureJourney();
  const photoPaths = [];
  const existingPhotoPaths = entry.cloudPhotoPaths ?? [];
  for (let index = 0; index < (entry.photos ?? []).length; index += 1) {
    const existingPath = existingPhotoPaths[index];
    if (existingPath) {
      photoPaths.push(existingPath);
      continue;
    }
    const photo = entry.photos[index];
    if (photo.startsWith("data:")) photoPaths.push(await uploadDataUrl(photo, entry.id, index));
  }
  const payload = {
    id: entry.id,
    journey_id: journeyId,
    owner_id: currentUser.id,
    country_code: entry.countryCode,
    country_name: entry.countryName,
    dish_name: entry.dishName,
    cooked_at: entry.cookedAt,
    rating_person_1: entry.ratingPerson1 || null,
    rating_person_2: entry.ratingPerson2 || null,
    actual_minutes: entry.actualMinutes || null,
    cost_nok: entry.costNok || null,
    roles: entry.roles || null,
    personal_twist: entry.personalTwist || null,
    notes: entry.notes || null,
    next_time: entry.nextTime || null,
    memory: entry.memory || null,
    photo_paths: photoPaths,
    recipe_snapshot: entry.recipeSnapshot || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabaseClient.from("cookbook_entries").upsert(payload, { onConflict: "id" });
  if (error) throw error;
  return { synced: true, photoPaths };
}

export async function pullCloudEntries() {
  await initCloud();
  if (!currentUser) return [];
  const { data, error } = await supabaseClient
    .from("cookbook_entries")
    .select("*")
    .eq("owner_id", currentUser.id)
    .order("cooked_at", { ascending: false });
  if (error) throw error;
  const output = [];
  for (const row of data ?? []) {
    const photos = [];
    for (const path of row.photo_paths ?? []) {
      const { data: signed } = await supabaseClient.storage.from("meal-photos").createSignedUrl(path, 60 * 60 * 24);
      if (signed?.signedUrl) photos.push(signed.signedUrl);
    }
    output.push({
      id: row.id,
      countryCode: row.country_code,
      countryName: row.country_name,
      dishName: row.dish_name,
      cookedAt: row.cooked_at,
      ratingPerson1: row.rating_person_1,
      ratingPerson2: row.rating_person_2,
      actualMinutes: row.actual_minutes,
      costNok: row.cost_nok,
      roles: row.roles,
      personalTwist: row.personal_twist,
      notes: row.notes,
      nextTime: row.next_time,
      memory: row.memory,
      photos,
      recipeSnapshot: row.recipe_snapshot,
      createdAt: row.created_at,
      cloudPhotoPaths: row.photo_paths ?? [],
      cloudSynced: true,
    });
  }
  return output;
}
