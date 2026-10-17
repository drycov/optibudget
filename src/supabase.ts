import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anon && url.startsWith("http"));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anon!)
  : null;

export type CloudProject = {
  id: string;
  owner_id: string;
  title: string;
  technology: string;
  notes: string;
  linear_profile: Record<string, unknown>;
  linear_elements: unknown[];
  topology_nodes: unknown[];
  map_routes: unknown[];
  map_center: { lat: number; lng: number; zoom: number };
  schema_version: number;
  created_at: string;
  updated_at: string;
};

export async function getSessionUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) throw new Error("Supabase не настроен. Задайте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.");
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  if (!supabase) throw new Error("Supabase не настроен.");
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function listProjects(): Promise<CloudProject[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CloudProject[];
}

export async function saveProject(payload: {
  id?: string;
  title: string;
  technology: string;
  notes?: string;
  linear_profile: Record<string, unknown>;
  linear_elements: unknown[];
  topology_nodes: unknown[];
  map_routes: unknown[];
  map_center: { lat: number; lng: number; zoom: number };
}): Promise<CloudProject> {
  if (!supabase) throw new Error("Supabase не настроен.");
  const user = await getSessionUser();
  if (!user) throw new Error("Войдите в аккаунт, чтобы сохранить в облако.");

  const row = {
    ...payload,
    owner_id: user.id,
    schema_version: 2,
    updated_at: new Date().toISOString()
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from("projects")
      .update(row)
      .eq("id", payload.id)
      .eq("owner_id", user.id)
      .select()
      .single();
    if (error) throw error;
    return data as CloudProject;
  }

  const { data, error } = await supabase.from("projects").insert(row).select().single();
  if (error) throw error;
  return data as CloudProject;
}

export async function deleteProject(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase не настроен.");
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function loadProject(id: string): Promise<CloudProject | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as CloudProject | null;
}
