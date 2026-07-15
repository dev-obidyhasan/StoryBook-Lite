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

// ─── Product Types ────────────────────────────────────────────────
export type ProductType =
  | "STORY"
  | "COLORING"
  | "SUPERHERO"
  | "BIRTHDAY"
  | "EDUCATIONAL"
  | "ISLAMIC"
  | "ALPHABET";

// ─── Order Status ─────────────────────────────────────────────────
export type OrderStatus =
  | "PENDING"
  | "GENERATING"
  | "REVIEW"
  | "PDF_PENDING"
  | "PDF_READY"
  | "CANCELLED"
  | "FAILED";

// ─── Page Status ──────────────────────────────────────────────────
export type PageStatus =
  | "PENDING"
  | "GENERATING"
  | "READY_FOR_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PERMANENTLY_FAILED";

// ─── Book Template ────────────────────────────────────────────────
export type BookTemplate = {
  id: string;
  name: string;
  productType: ProductType;
  pageCount: number;
  stylePrompt: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  pages?: TemplatePage[];
  _count?: { orders: number };
};

export type PlatformAIDefaults = {
  platformDefaults: {
    masterSheetPromptTemplate: string | null;
    pageSystemPrompt: string;
    pageSystemPromptCompact: string;
    consistencyLockTokens: string;
    defaultPagePromptTemplate: string;
    generationMode: string;
    requiresCharacterSheet: boolean;
  };
  supportedVariables: Record<string, string>;
};

export type PromptPreviewResult = {
  templateId: string;
  sample: {
    childName: string;
    childAge?: number;
    childGender: "MALE" | "FEMALE";
    pageNumber?: number;
  };
  requiresCharacterSheet: boolean;
  masterSheetPrompt: string;
  pages: Array<{
    pageNumber: number;
    sceneLabel: string | null;
    promptVersion: number;
    illustrationPrompt: string;
    storyText: string;
    systemPrompt: string;
    targetWidth: number;
    targetHeight: number;
  }>;
};

export type ActiveTemplate = {
  id: string;
  name: string;
  productType: ProductType;
  pageCount: number;
  description: string | null;
};

// ─── Template Page ────────────────────────────────────────────────
export type TemplatePage = {
  id: string;
  templateId: string;
  pageNumber: number;
  promptTemplate: string;
  promptVersion?: number;
  layoutFilePath: string;
  imageZoneJson: ImageZone[];
  textZoneJson: TextZone[];
  sceneLabel: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ImageZone = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "image";
};

export type TextZone = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  font?: string;
  size?: number;
  color?: string;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  backgroundColor?: string;
  backgroundOpacity?: number;
  paddingX?: number;
  paddingY?: number;
};

/** Sentinel value — full-page illustration mode (no layout PDF). */
export const FULL_PAGE_LAYOUT_SENTINEL = "__full_page__";

// ─── Illustration ─────────────────────────────────────────────────
export type Illustration = {
  id: string;
  signedUrl: string | null;
  aiProvider: string;
  modelUsed: string | null;
  createdAt: string;
};

// ─── Order Page ───────────────────────────────────────────────────
export type OrderPage = {
  pageId: string;
  pageNumber: number;
  sceneLabel: string;
  status: PageStatus;
  updatedAt: string;
  illustration: Illustration | null;
  storyText?: string;
};

export type OrderPageStatus = {
  pageNumber: number;
  status: PageStatus;
};

// ─── Order ────────────────────────────────────────────────────────
export type Order = {
  id: string;
  userId: string;
  templateId: string;
  childName: string;
  childAge: number | null;
  childGender: "MALE" | "FEMALE";
  photoPath: string;
  masterCharacterSheetPath: string | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    name: string;
    productType: ProductType;
    pageCount: number;
  };
  _count?: { orderPages: number };
};

export type OrderDetail = Order & {
  orderPages: Array<{
    id: string;
    pageNumber: number;
    status: PageStatus;
    updatedAt: string;
    illustration: {
      id: string;
      imagePath: string;
      aiProvider: string;
      createdAt: string;
    } | null;
  }>;
  pdfs: Array<{
    id: string;
    createdAt: string;
    expiresAt: string;
    fileSizeBytes: number | null;
  }>;
  progress: {
    totalPages: number;
    approvedPages: number;
    readyPages: number;
    progressPercent: number;
  };
};

// ─── Order Status Response ────────────────────────────────────────
export type OrderStatusResponse = {
  orderId: string;
  status: OrderStatus;
  updatedAt: string;
  pages: OrderPageStatus[];
  progress: {
    totalPages: number;
    readyPages: number;
    approvedPages: number;
    generatingPages: number;
    failedPages: number;
    progressPercent: number;
  };
};

// ─── Illustrations Review Response ────────────────────────────────
export type IllustrationsReviewResponse = {
  orderId: string;
  orderStatus: OrderStatus;
  childPhotoUrl: string | null;
  pages: OrderPage[];
  summary: {
    totalPages: number;
    approved: number;
    readyForReview: number;
    generating: number;
    failed: number;
    progressPercent: number;
  };
};

// ─── PDF Info ─────────────────────────────────────────────────────
export type PDFInfo = {
  id: string;
  fileSizeBytes: number | null;
  createdAt: string;
  expiresAt: string;
};

export type PDFDownloadResponse = {
  orderId: string;
  downloadUrl: string;
  expiresIn: string;
  fileSizeBytes: number | null;
  generatedAt: string | null;
  expiresAt: string | null;
};
