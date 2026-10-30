"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/config";

type DeleteAccountResult = { success: true } | { success: false; error: string };

export async function deleteOwnAccount(): Promise<DeleteAccountResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Conecte o Supabase para excluir uma conta real." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Sua sessão expirou. Entre novamente para excluir seu perfil." };
  }

  const { data: preview, error: previewError } = await supabase.rpc("delete_my_account", { p_preview: true });
  if (previewError || preview !== true) {
    return { success: false, error: "A exclusão ainda não está habilitada no banco. Aplique o schema atualizado do Supabase e tente novamente." };
  }

  const avatarStorage = supabase.storage.from("avatars");
  const avatarPaths: string[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await avatarStorage.list(user.id, { limit: 100, offset });
    if (error) {
      return { success: false, error: "Não foi possível preparar a remoção das fotos. Sua conta continua ativa." };
    }
    avatarPaths.push(...data.filter((file) => file.id !== null).map((file) => `${user.id}/${file.name}`));
    if (data.length < 100) break;
    offset += data.length;
  }

  for (let index = 0; index < avatarPaths.length; index += 100) {
    const { error } = await avatarStorage.remove(avatarPaths.slice(index, index + 100));
    if (error) {
      return { success: false, error: "Não foi possível remover as fotos do perfil. Sua conta continua ativa." };
    }
  }

  const { error: deleteError } = await supabase.rpc("delete_my_account", { p_preview: false });
  if (deleteError) {
    return { success: false, error: "As fotos foram removidas, mas a conta continua ativa. Aplique o schema atualizado e tente novamente." };
  }

  await supabase.auth.signOut({ scope: "local" });
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token")) cookieStore.delete(cookie.name);
  }
  revalidatePath("/");
  revalidatePath("/perfil");
  revalidatePath("/perfil/conta");
  return { success: true };
}
