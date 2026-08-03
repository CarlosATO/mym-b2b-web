export type BsaleVariantFixture = {
  bsaleVariantId: string | null;
  sku: string | null;
  name: string | null;
  isActiveInBsale: boolean;
  stockQuantity?: number | null;
  price?: number | null;
};


export type ExistingWebProductFixture = {
  id: string;
  sku: string | null;
  bsaleVariantId: string | null;
  name: string;
  slug: string;
  isActive: boolean;
  isVisible: boolean;
  reviewStatus: 'draft' | 'ready' | 'published';
  hasCuratedContent: boolean;
};

export type ActionType = 'create' | 'update' | 'link_existing' | 'skip' | 'conflict' | 'error';
export type StatusType = 'pending' | 'success' | 'skipped' | 'conflict' | 'error';
export type ConflictType = 
  | 'duplicate_sku'
  | 'duplicate_bsale_variant_id'
  | 'sku_variant_mismatch'
  | 'missing_sku'
  | 'missing_name'
  | 'inactive_in_bsale_active_in_web'
  | 'invalid_payload'
  | 'unknown';

export type PlannerItemResult = {
  action: ActionType;
  status: StatusType;
  sku: string | null;
  bsaleVariantId: string | null;
  sourceName: string | null;
  matchedProductId: string | null;
  conflictType?: ConflictType;
  message: string | null;
  proposedChanges: unknown;
  shouldWriteProduct: boolean;
};

export type PlannerSummary = {
  totalSeen: number;
  totalCreated: number;
  totalUpdated: number;
  totalLinkedExisting: number;
  totalSkipped: number;
  totalConflicts: number;
  totalErrors: number;
};

export type PlannerResult = {
  items: PlannerItemResult[];
  summary: PlannerSummary;
};
