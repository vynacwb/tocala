/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Mail, MapPin, Pencil, Phone, Settings, Star } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ProfileActionsMenu } from "@/components/profile/profile-actions-menu";
import { ProfileRatingSummary, ProfileReviews } from "@/components/profile/profile-ratings";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import { SignOutButton } from "@/components/profile/sign-out-button";
import { BOOKING_WEEKDAYS } from "@/lib/availability";
import type { DemoReview } from "@/lib/demo-reviews";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = { title: "Perfil" };
export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  full_name: string;
  contact_email: string;
  contact_phone: string;
  city: string;
  state: string;
  username: string;
  genre: string;
  bio: string;
  career: string;
  avatar_url: string;
  avatar_position_x: number;
  avatar_position_y: number;
  booking_weekdays: number[];
  level: number;
  rating: number;
  review_count: number;
};

type Review = {
  id: string;
  author_name: string;
  author_avatar_url: string;
  body: string;
  rating: number;
};

const demoProfile: Profile = {
  id: "marina-luz",
  full_name: "Marina Luz",
  contact_email: "contato@marinaluz.com",
  contact_phone: "+55 11 99999-1234",
  city: "São Paulo",
  state: "SP",
  username: "marinaluz",
  genre: "MPB · Soul",
  bio: "Cantora e compositora movida por encontros, histórias e pela força da música brasileira. Cada apresentação é criada para aproximar o público e transformar o palco em um espaço de troca.",
  career: "Com oito anos de estrada, Marina já passou por casas de show e festivais em diferentes cidades. Seu repertório reúne composições autorais, releituras da MPB e influências de soul contemporâneo.",
  avatar_url: "https://images.unsplash.com/photo-1643370857818-d3705b0a1ec1?auto=format&fit=crop&w=600&q=85",
  avatar_position_x: 50,
  avatar_position_y: 50,
  booking_weekdays: [5, 6, 0],
  level: 0,
  rating: 4.9,
  review_count: 48,
};

function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`;
}

async function getProfileData(publicArtistId?: string): Promise<{ profile: Profile; reviews: Review[]; demoReviews: DemoReview[]; isPublicView: boolean; useLocalDemoReviews: boolean }> {
  if (!isSupabaseConfigured()) return { profile: demoProfile, reviews: [], demoReviews: [], isPublicView: Boolean(publicArtistId), useLocalDemoReviews: true };

  const supabase = await createClient();

  if (publicArtistId) {
    if (!/^[0-9a-f-]{36}$/i.test(publicArtistId)) notFound();
    const [{ data: profileData }, { data: reviewsData }, { data: demoReviewsData }] = await Promise.all([
      supabase.from("profiles").select("real_name, stage_name, full_name, username, genre, bio, career, avatar_url, avatar_position_x, avatar_position_y, booking_weekdays, level, rating, review_count, contact_email, contact_phone, city, state").eq("id", publicArtistId).eq("profile_visible", true).eq("status", "ATIVO").maybeSingle(),
      supabase.from("reviews").select("id, author_name, author_avatar_url, body, rating").eq("artist_id", publicArtistId).order("created_at", { ascending: false }).limit(6),
      supabase.from("demo_reviews").select("id, artist_id, author_name, body, rating, created_at").eq("artist_id", publicArtistId).order("created_at", { ascending: false }).limit(20),
    ]);
    if (!profileData) notFound();
    const profile: Profile = {
      ...demoProfile,
      id: publicArtistId,
      full_name: profileData.stage_name || profileData.real_name || profileData.full_name || profileData.username,
      username: profileData.username,
      genre: profileData.genre,
      bio: profileData.bio,
      career: profileData.career,
      avatar_url: profileData.avatar_url || demoProfile.avatar_url,
      avatar_position_x: profileData.avatar_position_x ?? 50,
      avatar_position_y: profileData.avatar_position_y ?? 50,
      booking_weekdays: Array.isArray(profileData.booking_weekdays) ? profileData.booking_weekdays.map(Number) : demoProfile.booking_weekdays,
      level: profileData.level,
      rating: Number(profileData.rating),
      review_count: profileData.review_count,
      contact_email: profileData.contact_email,
      contact_phone: profileData.contact_phone,
      city: profileData.city,
      state: profileData.state,
    };
    return { profile, reviews: reviewsData ?? [], demoReviews: (demoReviewsData ?? []).map((review) => ({ id: review.id, artistId: review.artist_id, authorName: review.author_name, rating: review.rating, comment: review.body, createdAt: review.created_at })), isPublicView: true, useLocalDemoReviews: false };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/perfil");

  const [{ data: profileData }, { data: reviewsData }, { data: demoReviewsData }] = await Promise.all([
    supabase.from("profiles").select("real_name, stage_name, full_name, username, genre, bio, career, avatar_url, avatar_position_x, avatar_position_y, booking_weekdays, level, rating, review_count, contact_email, contact_phone, city, state").eq("id", user.id).maybeSingle(),
    supabase.from("reviews").select("id, author_name, author_avatar_url, body, rating").eq("artist_id", user.id).order("created_at", { ascending: false }).limit(6),
    supabase.from("demo_reviews").select("id, artist_id, author_name, body, rating, created_at").eq("artist_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const profile: Profile = {
    ...demoProfile,
    id: user.id,
    full_name: profileData?.stage_name || profileData?.real_name || profileData?.full_name || user.user_metadata.full_name || demoProfile.full_name,
    username: profileData?.username || user.email?.split("@")[0] || demoProfile.username,
    genre: profileData?.genre || demoProfile.genre,
    bio: profileData?.bio || demoProfile.bio,
    career: profileData?.career || demoProfile.career,
    avatar_url: profileData?.avatar_url || demoProfile.avatar_url,
    avatar_position_x: profileData?.avatar_position_x ?? 50,
    avatar_position_y: profileData?.avatar_position_y ?? 50,
    booking_weekdays: Array.isArray(profileData?.booking_weekdays) ? profileData.booking_weekdays.map(Number) : demoProfile.booking_weekdays,
    contact_email: profileData?.contact_email || "",
    contact_phone: profileData?.contact_phone || "",
    city: profileData?.city || "",
    state: profileData?.state || "",
    level: profileData?.level ?? demoProfile.level,
    rating: Number(profileData?.rating ?? 0),
    review_count: profileData?.review_count ?? 0,
  };

  return { profile, reviews: reviewsData ?? [], demoReviews: (demoReviewsData ?? []).map((review) => ({ id: review.id, artistId: review.artist_id, authorName: review.author_name, rating: review.rating, comment: review.body, createdAt: review.created_at })), isPublicView: false, useLocalDemoReviews: false };
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ artista?: string }> }) {
  const { artista } = await searchParams;
  const configured = isSupabaseConfigured();
  const { profile, reviews, demoReviews, isPublicView, useLocalDemoReviews } = await getProfileData(artista);
  const bookingDays = BOOKING_WEEKDAYS.filter((day) => profile.booking_weekdays.includes(day.value));

  return (
    <div className="mx-auto min-h-dvh max-w-[400px] bg-[#1A1A1A] shadow-2xl shadow-black/40 lg:max-w-none lg:bg-[#101010] lg:shadow-none">
      <header className="fixed left-1/2 top-0 z-50 w-full max-w-[400px] -translate-x-1/2 border-b border-white/10 bg-[#1A1A1A]/95 backdrop-blur-xl lg:max-w-none">
        <div className="relative mx-auto flex h-[calc(env(safe-area-inset-top)+76px)] max-w-[1200px] items-center justify-between px-5 pt-[env(safe-area-inset-top)] lg:h-20 lg:px-6 lg:pt-0">
          <Link href="/" className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#D6A0FF] transition hover:border-[#BA3BE7] hover:bg-[#6C1EE7]/15" aria-label="Voltar para o início"><ArrowLeft className="size-5" /></Link>
          <div className="absolute left-1/2 -translate-x-1/2"><Brand compact /></div>
          <div className="flex items-center gap-2">
            {!isPublicView && <>
            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/perfil/disponibilidade" className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70 transition hover:border-[#BA3BE7] hover:text-[#D6A0FF]" aria-label="Disponibilidade">
                <CalendarDays className="size-5" strokeWidth={1.8} />
              </Link>
              <Link href="/perfil/configuracoes" className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70 transition hover:border-[#BA3BE7] hover:text-[#D6A0FF]" aria-label="Personalização do perfil">
                <Pencil className="size-5" strokeWidth={1.8} />
              </Link>
              <Link href="/perfil/conta" className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70 transition hover:border-[#BA3BE7] hover:text-[#D6A0FF]" aria-label="Configurações">
                <Settings className="size-5" strokeWidth={1.8} />
              </Link>
              <SignOutButton configured={configured} />
            </div>
            <ProfileActionsMenu configured={configured} />
            </>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[400px] space-y-6 px-5 pb-32 pt-[calc(env(safe-area-inset-top)+100px)] lg:max-w-[1200px] lg:space-y-8 lg:px-6 lg:pb-20 lg:pt-32">
        <Card className="relative overflow-hidden lg:rounded-3xl">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-[#6C1EE7]/30 via-[#BA3BE7]/15 to-transparent lg:h-40" />
          <div className="relative flex flex-col items-center px-5 pb-6 pt-10 text-center lg:px-10 lg:pb-8 lg:pt-12">
            <div className="size-32 overflow-hidden rounded-full border-4 border-[#1A1A1A] bg-[#30243B] shadow-xl shadow-black/40 ring-2 ring-[#BA3BE7]/65 lg:size-40">
              <img src={profile.avatar_url} alt={`Retrato de ${profile.full_name}`} style={{ objectPosition: `${profile.avatar_position_x}% ${profile.avatar_position_y}%` }} className="h-full w-full object-cover" />
            </div>
            <div className="mt-5">
              <h1 className="text-[28px] font-bold leading-tight tracking-[-0.04em] lg:text-[40px]">{profile.full_name}</h1>
              <p className="mt-1 text-sm text-white/60 lg:text-base">@{profile.username}</p>
              <p className="mt-3 text-sm italic text-[#D6A0FF] lg:text-base">{profile.genre}</p>
              {(profile.city || profile.state) && <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/55"><MapPin className="size-4 text-[#D6A0FF]" />{[profile.city, profile.state].filter(Boolean).join(", ")}</p>}
            </div>
            <div className="mt-7 flex w-full max-w-[480px] items-center justify-between gap-4 border-t border-white/10 pt-6">
              <div className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#FBBF24] px-3.5 font-bold text-[#1A1A1A] shadow-lg shadow-[#FBBF24]/15" aria-label={`Nível ${profile.level}`}>
                <Star className="size-6" strokeWidth={1.8} /><span className="text-lg">{String(profile.level).padStart(2, "0")}</span>
              </div>
              <div className="text-[21px] lg:text-[27px]"><ProfileRatingSummary artistId={profile.id} rating={profile.rating} count={profile.review_count} sharedReviews={demoReviews} useLocalDemoReviews={useLocalDemoReviews} /></div>
            </div>
          </div>
        </Card>

        {isPublicView && artista && <Card className="flex flex-col items-start justify-between gap-4 border-[#BA3BE7]/25 bg-[#6C1EE7]/10 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">Gostou do trabalho de {profile.full_name}?</h2>
            <p className="mt-1 text-sm text-white/55">Envie uma proposta de contratação para uma apresentação.</p>
          </div>
          <Link href={`/contratos/novo?artista=${encodeURIComponent(artista)}`} className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-xl bg-[#6C1EE7] px-5 text-sm font-semibold text-white transition hover:bg-[#BA3BE7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA3BE7] sm:w-auto">Contratar</Link>
        </Card>}

        {(profile.contact_email || profile.contact_phone) && <Card className="bg-[#222226] p-6 lg:p-8">
          <SectionTitle>Contato</SectionTitle>
          <div className="mt-5 flex flex-wrap gap-3">
            {profile.contact_email && <a href={`mailto:${profile.contact_email}`} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-sm text-white/75 transition hover:border-[#BA3BE7] hover:text-[#D6A0FF]"><Mail className="size-4" />{profile.contact_email}</a>}
            {profile.contact_phone && <a href={whatsappUrl(profile.contact_phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-sm text-white/75 transition hover:border-[#BA3BE7] hover:text-[#D6A0FF]"><Phone className="size-4" />WhatsApp</a>}
          </div>
        </Card>}

        <Card className="bg-[#222226] p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <SectionTitle>Dias para contratação:</SectionTitle>
              <p className="mt-2 text-sm text-white/50">Dias habituais em que o artista aceita propostas.</p>
            </div>
            {!isPublicView && <Link href="/perfil/disponibilidade" className="text-xs font-semibold text-[#D6A0FF] transition hover:text-white">Editar disponibilidade</Link>}
          </div>
          {bookingDays.length > 0 ? <div className="mt-5 flex flex-wrap gap-2">{bookingDays.map((day) => <span key={day.value} className="rounded-lg border border-[#BA3BE7]/25 bg-[#6C1EE7]/15 px-3 py-2 text-xs font-medium text-[#E4C9FF]">{day.label}</span>)}</div> : <p className="mt-5 text-sm text-white/50">Nenhum dia habitual selecionado.</p>}
        </Card>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          <Card className="bg-[#222226] p-6 lg:p-8">
            <SectionTitle>Sobre o artista:</SectionTitle>
            <p className="mt-5 text-sm leading-[1.85] text-white/65 lg:text-[15px]">{profile.bio}</p>
          </Card>
          <Card className="bg-[#222226] p-6 lg:p-8">
            <SectionTitle>Carreira:</SectionTitle>
            <p className="mt-5 text-sm leading-[1.85] text-white/65 lg:text-[15px]">{profile.career}</p>
          </Card>
        </div>

        <ProfileReviews artistId={profile.id} baseRating={profile.rating} baseCount={profile.review_count} reviews={reviews} sharedReviews={demoReviews} useLocalDemoReviews={useLocalDemoReviews} />
      </main>
      <MobileNav />
    </div>
  );
}
