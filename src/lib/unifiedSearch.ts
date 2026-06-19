import { UnifiedSearchResponse } from '@/types/search';

export async function searchAggregatedData(query: string, userId: string): Promise<UnifiedSearchResponse> {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    
    if (data.success) {
      return {
        results: data.results,
        total: data.total
      };
    } else {
      console.error('Unified Search Error:', data.error);
      return { results: [], total: 0 };
    }
  } catch (error) {
    console.error('Failed to fetch unified search data:', error);
    return { results: [], total: 0 };
  }
}
