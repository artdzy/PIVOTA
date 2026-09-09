export type WizardDraft = {
  step: number;
  fullName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  screeningAnswers: Record<string, string | boolean>;
  savedAt: string;
};

function draftKey(jobNo: string, userId: string) {
  return `pivota-draft-${jobNo}-${userId}`;
}

export function saveDraft(jobNo: string, userId: string, draft: WizardDraft) {
  try {
    localStorage.setItem(draftKey(jobNo, userId), JSON.stringify(draft));
  } catch {
    // localStorage kullanılamıyorsa sessizce yok say
  }
}

export function loadDraft(jobNo: string, userId: string): WizardDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(jobNo, userId));
    return raw ? (JSON.parse(raw) as WizardDraft) : null;
  } catch {
    return null;
  }
}

export function clearDraft(jobNo: string, userId: string) {
  try {
    localStorage.removeItem(draftKey(jobNo, userId));
  } catch {
    // yok say
  }
}
