export type CareerExperience = {
  id: string;
  title: string;
  description: string;
  photos: [string, string];
};

export type ProfileSettingsData = {
  realName: string;
  fullName: string;
  username: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  state: string;
  genre: string;
  bio: string;
  avatarUrl: string;
  experiences: CareerExperience[];
};

export type ProfileSettingsActionState = {
  status: "idle" | "success" | "error";
  message: string;
  submissionId: number;
};

const EXPERIENCE_SEPARATOR = "\n\n---\n\n";
const TITLE_PREFIX = "## ";

export function parseCareer(career: string, portfolioLinks: string[] = []): CareerExperience[] {
  const sections = career.trim() ? career.split(EXPERIENCE_SEPARATOR) : [];
  const parsed = sections.map((section, index) => {
    const lines = section.trim().split("\n");
    const hasTitle = lines[0]?.startsWith(TITLE_PREFIX);
    return {
      id: `experience-${index + 1}`,
      title: hasTitle ? lines[0].slice(TITLE_PREFIX.length).trim() : index === 0 ? "Minha trajetória" : `Experiência ${index + 1}`,
      description: (hasTitle ? lines.slice(1) : lines).join("\n").trim(),
      photos: [portfolioLinks[index * 2] ?? "", portfolioLinks[index * 2 + 1] ?? ""] as [string, string],
    };
  });

  return parsed.length
    ? parsed
    : [{ id: "experience-1", title: "Minha trajetória", description: "", photos: ["", ""] }];
}

export function serializeCareer(experiences: CareerExperience[]) {
  return experiences
    .map((experience) => `${TITLE_PREFIX}${experience.title.trim()}\n${experience.description.trim()}`.trim())
    .join(EXPERIENCE_SEPARATOR);
}
