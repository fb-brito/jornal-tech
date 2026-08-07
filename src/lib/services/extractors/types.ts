export interface ExtractionResult {
  title: string;
  desc: string;
  images: string[];
  coverImage: string;
  published_at: string | null;
  modified_at: string | null;
  source_metadata: string | null;
  is404: boolean;
  isBlocked: boolean;
  success: boolean;
}

export const defaultExtractionResult: ExtractionResult = {
  title: "",
  desc: "",
  images: [],
  coverImage: "",
  published_at: null,
  modified_at: null,
  source_metadata: null,
  is404: false,
  isBlocked: false,
  success: false
};
