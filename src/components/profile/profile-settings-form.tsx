"use client";

/* eslint-disable @next/next/no-img-element */
import { useActionState, useEffect, useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Camera, ChevronDown, ImagePlus, LoaderCircle, Mail, MapPin, Phone, Plus, Save, Sparkles, Trash2, UserRound } from "lucide-react";
import { saveProfileSettings } from "@/app/perfil/configuracoes/actions";
import { useToast } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import type { CareerExperience, ProfileSettingsActionState, ProfileSettingsData } from "@/lib/profile-settings";
import { createClient } from "@/utils/supabase/client";
import { MUSIC_GENRES } from "@/lib/genres";

const initialActionState: ProfileSettingsActionState = { status: "idle", message: "", submissionId: 0 };

function FieldLabel({ children, optional = false }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-white/80">
      {children}
      {optional && <span className="text-[11px] font-normal uppercase tracking-[0.12em] text-white/35">Opcional</span>}
    </span>
  );
}

function PhotoUrlField({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return (
    <label className="group block">
      <FieldLabel optional>{label}</FieldLabel>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-dashed border-white/20 bg-[#18181B] transition group-focus-within:border-[#BA3BE7] group-hover:border-[#BA3BE7]/65">
        {value ? (
          <img src={value} alt="Prévia da experiência" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-white/40">
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#6C1EE7]/15 text-[#D6A0FF]"><ImagePlus className="size-5" /></span>
            <span className="text-xs font-medium">Adicionar foto</span>
          </div>
        )}
        <div className="absolute inset-x-2 bottom-2 rounded-xl border border-white/10 bg-black/70 p-2 backdrop-blur-md">
          <input
            type="url"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="https://imagem..."
            aria-label={`${label}, URL da imagem`}
            className="h-8 w-full bg-transparent px-1 text-xs text-white outline-none placeholder:text-white/35"
          />
        </div>
      </div>
    </label>
  );
}

export function ProfileSettingsForm({ initialData, configured }: { initialData: ProfileSettingsData; configured: boolean }) {
  const [state, formAction, pending] = useActionState(saveProfileSettings, initialActionState);
  const [realName, setRealName] = useState(initialData.realName);
  const [fullName, setFullName] = useState(initialData.fullName);
  const [username, setUsername] = useState(initialData.username);
  const [contactEmail, setContactEmail] = useState(initialData.contactEmail);
  const [contactPhone, setContactPhone] = useState(initialData.contactPhone);
  const [city, setCity] = useState(initialData.city);
  const [stateCode, setStateCode] = useState(initialData.state);
  const [genre, setGenre] = useState(initialData.genre);
  const [bio, setBio] = useState(initialData.bio);
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl);
  const [avatarPositionX, setAvatarPositionX] = useState(initialData.avatarPositionX);
  const [avatarPositionY, setAvatarPositionY] = useState(initialData.avatarPositionY);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [experiences, setExperiences] = useState<CareerExperience[]>(initialData.experiences);
  const { toast } = useToast();

  useEffect(() => {
    if (!state.submissionId) return;
    toast(state.message, state.status === "success" ? "success" : "error");
  }, [state, toast]);

  const serializedExperiences = useMemo(() => JSON.stringify(experiences), [experiences]);

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast("Envie uma imagem JPG, PNG, WebP ou GIF.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("A imagem deve ter no máximo 5 MB.", "error");
      return;
    }

    setUploadingAvatar(true);
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setUploadingAvatar(false);
      toast("Entre novamente para enviar sua foto.", "error");
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    setUploadingAvatar(false);
    if (error) {
      toast("Não foi possível enviar a foto. Verifique se o armazenamento de avatares foi configurado no Supabase.", "error");
      return;
    }
    setAvatarUrl(supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl);
    toast("Foto enviada. Salve a personalização para aplicar no perfil.");
  }

  function updateExperience(id: string, changes: Partial<CareerExperience>) {
    setExperiences((current) => current.map((experience) => (experience.id === id ? { ...experience, ...changes } : experience)));
  }

  function updatePhoto(id: string, index: 0 | 1, value: string) {
    setExperiences((current) => current.map((experience) => {
      if (experience.id !== id) return experience;
      const photos: [string, string] = [...experience.photos];
      photos[index] = value;
      return { ...experience, photos };
    }));
  }

  function addExperience() {
    if (experiences.length >= 5) {
      toast("Você pode adicionar até cinco experiências.", "error");
      return;
    }
    setExperiences((current) => [
      ...current,
      { id: crypto.randomUUID(), title: "", description: "", photos: ["", ""] },
    ]);
  }

  return (
    <form action={formAction} className="space-y-6 lg:space-y-8">
      <input type="hidden" name="experiences" value={serializedExperiences} />

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#1A1A1A] shadow-2xl shadow-black/25">
        <div className="h-1.5 bg-gradient-to-r from-[#6C1EE7] via-[#BA3BE7] to-[#D6A0FF]" />
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[260px_1fr] lg:gap-9 lg:p-9">
          <div>
            <div className="grid grid-cols-[116px_1fr] items-center gap-4 lg:block">
              <div className="relative mx-auto size-28 lg:size-44">
                <div className="h-full w-full overflow-hidden rounded-full border-4 border-[#1A1A1A] bg-[#27232D] shadow-2xl shadow-black/40 ring-2 ring-[#BA3BE7]/65">
                  {avatarUrl ? <img src={avatarUrl} alt="Prévia da foto de perfil" style={{ objectPosition: `${avatarPositionX}% ${avatarPositionY}%` }} className="h-full w-full object-cover" /> : <UserRound className="h-full w-full p-7 text-white/25" />}
                </div>
                <span className="absolute bottom-1 right-0 flex size-10 items-center justify-center rounded-xl border-2 border-[#1A1A1A] bg-[#6C1EE7] text-white shadow-lg shadow-[#6C1EE7]/30 lg:bottom-2 lg:size-12">
                  <Camera className="size-5" />
                </span>
              </div>
              <div className="lg:mt-5 lg:text-center">
                <h2 className="text-base font-semibold lg:text-lg">Foto do perfil</h2>
                <p className="mt-1 text-xs leading-relaxed text-white/45">Use uma foto nítida e bem iluminada.</p>
              </div>
            </div>
            <label className="mt-4 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#BA3BE7]/35 bg-[#6C1EE7]/15 px-3 text-sm font-semibold text-[#D6A0FF] transition hover:bg-[#6C1EE7]/25 lg:mt-5">
              {uploadingAvatar ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
              {uploadingAvatar ? "Enviando foto..." : "Enviar arquivo"}
              <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploadingAvatar} className="sr-only" />
            </label>
            <details className="mt-3 rounded-xl border border-white/10 bg-[#101010]/50 p-3">
              <summary className="cursor-pointer text-xs font-medium text-white/60">Ou use uma URL de imagem</summary>
              <input name="avatarUrl" type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://imagem..." aria-label="URL da foto de perfil" className="mt-3 h-11 w-full rounded-lg border border-white/15 bg-[#101010]/70 px-3 text-xs text-white outline-none transition placeholder:text-white/30 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20" />
            </details>
            <div className="mt-4 rounded-xl border border-white/10 bg-[#101010]/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-white/75">Ajustar enquadramento</p>
                <button type="button" onClick={() => { setAvatarPositionX(50); setAvatarPositionY(50); }} className="text-xs text-[#D6A0FF] transition hover:text-white">Centralizar</button>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-white/40">Mova o foco para escolher qual parte da foto aparece no perfil.</p>
              <label className="mt-3 block">
                <span className="flex justify-between text-[11px] text-white/55"><span>Horizontal</span><output>{avatarPositionX}%</output></span>
                <input name="avatarPositionX" type="range" min="0" max="100" value={avatarPositionX} onChange={(event) => setAvatarPositionX(Number(event.target.value))} aria-label="Posição horizontal da foto" className="mt-2 h-2 w-full cursor-pointer accent-[#BA3BE7]" />
              </label>
              <label className="mt-2 block">
                <span className="flex justify-between text-[11px] text-white/55"><span>Vertical</span><output>{avatarPositionY}%</output></span>
                <input name="avatarPositionY" type="range" min="0" max="100" value={avatarPositionY} onChange={(event) => setAvatarPositionY(Number(event.target.value))} aria-label="Posição vertical da foto" className="mt-2 h-2 w-full cursor-pointer accent-[#BA3BE7]" />
              </label>
            </div>
          </div>

          <div className="grid content-start gap-4 sm:grid-cols-2">
            <label className="block">
              <FieldLabel>Nome verdadeiro</FieldLabel>
              <input name="realName" value={realName} onChange={(event) => setRealName(event.target.value)} minLength={2} maxLength={100} required placeholder="Seu nome completo" autoComplete="name" className="h-14 w-full rounded-xl border border-white/15 bg-[#101010]/70 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20" />
              <span className="mt-2 block text-xs text-white/40">Será exibido no perfil se você não informar um nome artístico.</span>
            </label>
            <label className="block">
              <FieldLabel optional>Nome artístico</FieldLabel>
              <input name="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={80} placeholder="Como você quer ser chamado?" className="h-14 w-full rounded-xl border border-white/15 bg-[#101010]/70 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20" />
            </label>
            <label className="block sm:col-span-2">
              <FieldLabel>Nome de usuário</FieldLabel>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#D6A0FF]">@</span>
                <input name="username" value={username} onChange={(event) => setUsername(event.target.value.replace(/^@/, ""))} minLength={3} maxLength={30} pattern="[A-Za-z0-9._-]+" required placeholder="seu.usuario" className="h-14 w-full rounded-xl border border-white/15 bg-[#101010]/70 pl-9 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20" />
              </div>
            </label>
            <label className="relative block sm:col-span-2">
              <FieldLabel>Estilo musical</FieldLabel>
              <select name="genre" value={genre} onChange={(event) => setGenre(event.target.value)} required className="h-14 w-full appearance-none rounded-xl border border-white/15 bg-[#101010]/70 px-4 pr-12 text-sm text-white outline-none transition focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20">
                <option value="" disabled>Selecione seu estilo</option>
                {MUSIC_GENRES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute bottom-[18px] right-4 size-4 text-[#D6A0FF]" />
            </label>
            <div className="hidden rounded-2xl border border-[#BA3BE7]/20 bg-[#6C1EE7]/10 p-4 sm:col-span-2 sm:flex sm:items-center sm:gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#6C1EE7]/20 text-[#D6A0FF]"><Sparkles className="size-5" /></span>
              <p className="text-xs leading-relaxed text-white/55">Um perfil completo aumenta sua visibilidade nas buscas e ajuda contratantes a conhecerem seu trabalho.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#1A1A1A] p-5 shadow-2xl shadow-black/20 sm:p-7 lg:p-9">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#BA3BE7]">Informações públicas</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] lg:text-2xl">Contato e localização</h2>
          <p className="mt-2 text-sm text-white/50">Os contatos e a cidade serão exibidos no seu perfil público.</p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <FieldLabel optional>E-mail para contato</FieldLabel>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#D6A0FF]" />
              <input name="contactEmail" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} maxLength={254} autoComplete="email" placeholder="contato@email.com" className="h-14 w-full rounded-xl border border-white/15 bg-[#101010]/70 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20" />
            </span>
          </label>
          <label className="block">
            <FieldLabel optional>WhatsApp / telefone</FieldLabel>
            <span className="relative block">
              <Phone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#D6A0FF]" />
              <input name="contactPhone" type="tel" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} maxLength={30} autoComplete="tel" placeholder="(11) 99999-9999" className="h-14 w-full rounded-xl border border-white/15 bg-[#101010]/70 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20" />
            </span>
          </label>
          <label className="block">
            <FieldLabel optional>Cidade</FieldLabel>
            <span className="relative block">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#D6A0FF]" />
              <input name="city" value={city} onChange={(event) => setCity(event.target.value)} maxLength={100} autoComplete="address-level2" placeholder="Sua cidade" className="h-14 w-full rounded-xl border border-white/15 bg-[#101010]/70 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20" />
            </span>
          </label>
          <label className="block">
            <FieldLabel optional>Estado (UF)</FieldLabel>
            <input name="state" value={stateCode} onChange={(event) => setStateCode(event.target.value.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase())} maxLength={2} autoComplete="address-level1" placeholder="SP" className="h-14 w-full rounded-xl border border-white/15 bg-[#101010]/70 px-4 text-sm uppercase text-white outline-none transition placeholder:text-white/30 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20" />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#1A1A1A] p-5 shadow-2xl shadow-black/20 sm:p-7 lg:p-9">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#BA3BE7]">Apresentação</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] lg:text-2xl">Sobre o artista</h2>
          </div>
          <span className="text-xs tabular-nums text-white/35">{bio.length.toLocaleString("pt-BR")}/20.000</span>
        </div>
        <textarea name="bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={20000} rows={7} placeholder="Conte sua história, influências, repertório e o que torna suas apresentações especiais..." className="mt-5 min-h-44 w-full resize-y rounded-2xl border border-white/15 bg-[#101010]/70 p-4 text-sm leading-relaxed text-white outline-none transition placeholder:text-white/30 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20 lg:p-5" />
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#1A1A1A] p-5 shadow-2xl shadow-black/20 sm:p-7 lg:p-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#BA3BE7]">Portfólio</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] lg:text-2xl">Carreira</h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/45">{experiences.length} de 5 experiências</span>
        </div>

        <div className="mt-6 space-y-5">
          {experiences.map((experience, experienceIndex) => (
            <article key={experience.id} className="rounded-2xl border border-white/10 bg-[#222226] p-4 sm:p-5 lg:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D6A0FF]">Experiência {String(experienceIndex + 1).padStart(2, "0")}</span>
                {experiences.length > 1 && (
                  <button type="button" onClick={() => setExperiences((current) => current.filter((item) => item.id !== experience.id))} className="flex size-9 items-center justify-center rounded-xl text-white/40 transition hover:bg-rose-500/10 hover:text-rose-300" aria-label={`Remover experiência ${experienceIndex + 1}`}>
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                <div className="space-y-4">
                  <label className="block">
                    <FieldLabel>Título</FieldLabel>
                    <input value={experience.title} onChange={(event) => updateExperience(experience.id, { title: event.target.value })} minLength={2} maxLength={100} required placeholder="Ex.: Festival de Inverno" className="h-13 w-full rounded-xl border border-white/15 bg-[#101010]/70 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20" />
                  </label>
                  <label className="block">
                    <FieldLabel>Descrição</FieldLabel>
                    <textarea value={experience.description} onChange={(event) => updateExperience(experience.id, { description: event.target.value })} maxLength={3000} rows={7} placeholder="Descreva o projeto, evento ou momento marcante..." className="min-h-36 w-full resize-y rounded-xl border border-white/15 bg-[#101010]/70 p-4 text-sm leading-relaxed text-white outline-none transition placeholder:text-white/30 focus:border-[#BA3BE7] focus:ring-2 focus:ring-[#BA3BE7]/20" />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <PhotoUrlField value={experience.photos[0]} onChange={(value) => updatePhoto(experience.id, 0, value)} label="Foto 1" />
                  <PhotoUrlField value={experience.photos[1]} onChange={(value) => updatePhoto(experience.id, 1, value)} label="Foto 2" />
                </div>
              </div>
            </article>
          ))}
        </div>

        <button type="button" onClick={addExperience} className="mt-5 flex h-14 w-full items-center justify-between rounded-2xl border border-dashed border-[#BA3BE7]/45 bg-[#6C1EE7]/10 px-5 text-sm font-semibold text-[#D6A0FF] transition hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7]">
          <span>Adicionar experiência</span><Plus className="size-5" />
        </button>
      </section>

      {!configured && <p className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">Conecte o Supabase para habilitar o salvamento. A tela está em modo de demonstração.</p>}

      <div className="sticky bottom-4 z-20 flex items-center justify-end gap-3 rounded-2xl border border-white/10 bg-[#1A1A1A]/90 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-4">
        <Link href="/perfil" className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white">Pular personalização</Link>
        <Button type="submit" className="min-w-36" disabled={pending || !configured}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
          {pending ? "Salvando..." : "Salvar perfil"}
        </Button>
      </div>
    </form>
  );
}
