export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatRelativeDate(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMinutes < 1) return "az önce";
  if (diffMinutes < 60) return `${diffMinutes} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 30) return `${diffDays} gün önce`;
  return formatDate(dateString);
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  tam_zamanli: "Tam Zamanlı",
  yari_zamanli: "Yarı Zamanlı",
  uzaktan: "Uzaktan",
  hibrit: "Hibrit",
  staj: "Staj",
};

export function formatEmploymentType(type: string): string {
  return EMPLOYMENT_TYPE_LABELS[type] ?? type;
}

const STAGE_LABELS: Record<string, string> = {
  ilk_basvuru: "İlk Başvuru",
  telefon_gorusmesi: "Telefon Görüşmesi",
  teknik_mulakat: "Teknik Mülakat",
  teklif: "Teklif",
  ise_alindi: "İşe Alındı",
};

export function formatStage(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}

const ROLE_LABELS: Record<string, string> = {
  aday: "Aday",
  uzman: "İK Uzmanı",
  yonetici: "İK Yöneticisi",
  mudur: "Müdür",
};

export function formatRole(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
