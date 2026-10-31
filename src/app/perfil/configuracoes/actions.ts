"use server";

import { revalidatePath } from "next/cache";
import type { CareerExperience, ProfileSettingsActionState } from "@/lib/profile-settings";
import { serializeCareer } from "@/lib/profile-settings";
import { MUSIC_INSTRUMENTS } from "@/lib/instruments";
import { MUSIC_GENRES } from "@/lib/genres";
import { createClient } from "@/utils/supabase/server";

const allowedInstruments = new Set<string>(MUSIC_INSTRUMENTS);
const allowedGenres = new Set<string>(MUSIC_GENRES);

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

  const realName = String(formData.get("realName") ?? "").trim();
  const stageName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().replace(/^@/, "").toLowerCase();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim().toLowerCase();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim().toUpperCase();
  const genres = [...new Set(formData.getAll("genres").map((value) => String(value).trim()))];
  const genre = genres.join(" · ");
  const instruments = [...new Set(formData.getAll("instruments").map((value) => String(value).trim()))];
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const avatarPositionX = Number(formData.get("avatarPositionX") ?? 50);
  const avatarPositionY = Number(formData.get("avatarPositionY") ?? 50);

  if (realName.length < 2 || realName.length > 100) return errorState("Informe seu nome verdadeiro entre 2 e 100 caracteres.");
  if (stageName.length > 80 || (stageName.length > 0 && stageName.length < 2)) return errorState("O nome artístico deve ter pelo menos 2 caracteres ou ficar em branco.");
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) return errorState("O usuário deve ter de 3 a 30 caracteres: letras, números, ponto, hífen ou underline.");
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return errorState("Informe um e-mail de contato válido.");
  if (contactPhone.length > 30 || (contactPhone && contactPhone.replace(/\D/g, "").length < 8)) return errorState("Informe um WhatsApp válido com pelo menos 8 dígitos.");
  if (city.length > 100 || (state && !/^[A-Z]{2}$/.test(state)) || (Boolean(city) !== Boolean(state))) return errorState("Preencha cidade e sigla do estado juntos (por exemplo, São Paulo e SP).");
  if (genres.length === 0 || genres.length > MUSIC_GENRES.length || genres.some((item) => !allowedGenres.has(item))) return errorState("Selecione pelo menos um estilo musical da lista.");
  if (instruments.length > MUSIC_INSTRUMENTS.length || instruments.some((instrument) => !allowedInstruments.has(instrument))) return errorState("Selecione instrumentos da lista disponível.");
  if (bio.length > 20000) return errorState("O texto sobre o artista ultrapassou 20.000 caracteres.");
  if (!isWebUrl(avatarUrl)) return errorState("Informe uma URL válida para a foto de perfil.");
  if (![avatarPositionX, avatarPositionY].every((value) => Number.isInteger(value) && value >= 0 && value <= 100)) return errorState("Ajuste o enquadramento da foto entre 0 e 100.");

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
    .update({
      real_name: realName,
      stage_name: stageName,
      full_name: stageName || realName,
      username,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      city,
      state,
      profile_visible: true,
      genre,
      genres,
      instruments,
      bio,
      career,
      avatar_url: avatarUrl,
      avatar_position_x: avatarPositionX,
      avatar_position_y: avatarPositionY,
    })
    .eq("id", user.id);

  if (profileError) {
    if (profileError.code === "23505") return errorState("Este nome de usuário já está em uso.");
    return errorState("Não foi possível salvar as alterações do perfil.");
  }

  if (profile.account_type === "MUSICO") {
    const { error: musicianError } = await supabase.from("musician_profiles").upsert(
      {
        user_id: user.id,
        stage_name: stageName || realName,
        bio_description: bio,
        musical_genres: genres,
        portfolio_links: portfolioLinks,
      },
      { onConflict: "user_id" },
    );

    if (musicianError) return errorState("O perfil foi salvo, mas a carreira não pôde ser atualizada.");
  }

  revalidatePath("/perfil");
  revalidatePath("/perfil/configuracoes");
  revalidatePath("/");
  return { status: "success", message: "Perfil salvo e publicado nas buscas.", submissionId: Date.now() };
}
