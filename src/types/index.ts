// ─── Auth ─────────────────────────────────────────────────────────
export type UserRole = "SUPER_ADMIN" | "PRODUCTION_ADMIN" | "VIEWER";

export type UserInfo = {
  userId: string;
  email: string;
  role: UserRole;
};

// ─── API Response wrapper ─────────────────────────────────────────
export type ApiMeta = {
  page: number;
  limit: number;
  total: number;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  meta?: ApiMeta;
  data: T | null;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
  };
};

// ─── Book Template ────────────────────────────────────────────────
export type TemplateStatus = "DRAFT" | "PUBLISHED";
export type DimensionUnit = "MM" | "INCH";

export type BookTemplate = {
  id: string;
  name: string;
  slug: string;
  coverImage: string | null;
  width: number;
  height: number;
  unit: DimensionUnit;
  totalPages: number;
  status: TemplateStatus;
  createdAt: string;
  updatedAt: string;
  pages?: TemplatePage[];
};

export type ActiveTemplate = {
  id: string;
  name: string;
  slug: string;
  coverImage: string | null;
  width: number;
  height: number;
  unit: DimensionUnit;
  totalPages: number;
};

// ─── Template Page ────────────────────────────────────────────────
export type TemplatePage = {
  id: string;
  templateId: string;
  pageNumber: number;
  storyText: string | null;
  createdAt: string;
  updatedAt: string;
};

// ─── Print enhancement ───────────────────────────────────────────
export type EnhancementSettings = {
  brightness: number;
  contrast: number;
  exposure: number;
  gamma: number;
  shadows: number;
  highlights: number;
  saturation: number;
  sharpness: number;
  temperature: number;
};
export type EnhancementConfig = {
  enabled: boolean;
  mode: "preset" | "custom";
  presetId?: string;
  settings: EnhancementSettings;
};
export type EnhancementPreset = {
  id: string;
  name: string;
  settings: EnhancementSettings;
  isSystem: boolean;
};

// ─── Order ────────────────────────────────────────────────────────
export type Order = {
  id: string;
  customerName: string;
  templateId: string;
  createdAt: string;
  template?: BookTemplate;
  enhancement?: EnhancementConfig | null;
};
