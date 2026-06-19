export type SearchItemType = 'task' | 'email' | 'note';

export interface SearchResultItem {
  id: string;
  type: SearchItemType;
  title: string;
  preview: string;
  timestamp: string;
  url?: string;
  metadata?: any;
}

export interface UnifiedSearchResponse {
  results: SearchResultItem[];
  total: number;
}
