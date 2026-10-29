"use server";

import { revalidatePath } from "next/cache";
import type { CareerExperience, ProfileSettingsActionState } from "@/lib/profile-settings";
import { serializeCareer } from "@/lib/profile-settings";
import { createClient } from "@/utils/supabase/server";

function isWebUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function errorState(message: string): ProfileSettingsActionState {
  return { status: "error", message, submissionId: Date.now() };
}

export async function saveProfileSettings(
  _previousState: ProfileSettingsActionState,
  formData: FormData,
): Promise<ProfileSettingsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return errorState("Sua sessão expirou. Entre novamente para salvar o perfil.");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().replace(/^@/, "").toLowerCase();
  const genre = String(formData.get("genre") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();

  if (fullName.length < 2 || fullName.length > 80) return errorState("Informe um nome entre 2 e 80 caracteres.");
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) return errorState("O usuário deve ter de 3 a 30 caracteres: letras, números, ponto, hífen ou underline.");
  if (!genre || genre.length > 60) return errorState("Selecione um estilo musical válido.");
  if (bio.length > 20000) return errorState("O texto sobre o artista ultrapassou 20.000 caracteres.");
  if (!isWebUrl(avatarUrl)) return errorState("Informe uma URL válida para a foto de perfil.");

  let experiences: CareerExperience[];
  try {
    experiences = JSON.parse(String(formData.get("experiences") ?? "[]")) as CareerExperience[];
  } catch {
    return errorState("Não foi possível ler as experiências profissionais.");
  }

  if (!Array.isArray(experiences) || experiences.length < 1 || experiences.length > 5) {
    return errorState("Adicione entre uma e cinco experiências profissionais.");
  }

  for (const experience of experiences) {
    if (experience.title.trim().length < 2 || experience.title.length > 100) return errorState("Revise o título das experiências.");
    if (experience.description.length > 3000) return errorState("Uma descrição de carreira ultrapassou 3.000 caracteres.");
    if (!Array.isArray(experience.photos) || experience.photos.length !== 2 || experience.photos.some((photo) => !isWebUrl(photo.trim()))) {
      return errorState("Revise as URLs das fotos de carreira.");
    }
  }

  const career = serializeCareer(experiences);
  const portfolioLinks = experiences.flatMap((experience) => experience.photos.map((photo) => photo.trim())).filter(Boolean);

  const { data: profile, error: profileReadError } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single();

  if (profileReadError) return errorState("Não foi possível localizar seu perfil.");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName, username, genre, bio, career, avatar_url: avatarUrl })
    .eq("id", user.id);

  if (profileError) {
    if (profileError.code === "23505") return errorState("Este nome de usuário já está em uso.");
    return errorState("Não foi possível salvar as alterações do perfil.");
  }

  if (profile.account_type === "MUSICO") {
    const { error: musicianError } = await supabase.from("musician_profiles").upsert(
      {
        user_id: user.id,
        stage_name: fullName,
        bio_description: bio,
        musical_genres: [genre],
        portfolio_links: portfolioLinks,
      },
      { onConflict: "user_id" },
    );

    if (musicianError) return errorState("O perfil foi salvo, mas a carreira não pôde ser atualizada.");
  }

  revalidatePath("/perfil");
  revalidatePath("/perfil/configuracoes");
  return { status: "success", message: "Perfil atualizado com sucesso.", submissionId: Date.now() };
}
