import { useState, useEffect } from 'react';
import type { LinkedInExecutive, LinkedInExecutivesResponse } from '@chti/shared';

interface UseLinkedInExecutivesState {
  executives: LinkedInExecutive[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch LinkedIn executives for a company
 * 
 * Usage:
 * const { executives, loading, error } = useLinkedInExecutives(companyId);
 */
export function useLinkedInExecutives(companyId: string): UseLinkedInExecutivesState {
  const [state, setState] = useState<UseLinkedInExecutivesState>({
    executives: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!companyId) {
      setState({ executives: [], loading: false, error: null });
      return;
    }

    const fetchExecutives = async () => {
      try {
        const response = await fetch(`/api/companies/${companyId}/linkedin-executives`);

        if (!response.ok) {
          throw new Error(`Failed to fetch executives: ${response.statusText}`);
        }

        const data: LinkedInExecutivesResponse = await response.json();

        if (data.success) {
          setState({
            executives: data.executives,
            loading: false,
            error: null,
          });
        } else {
          setState({
            executives: [],
            loading: false,
            error: data.message || 'Failed to fetch executives',
          });
        }
      } catch (err) {
        setState({
          executives: [],
          loading: false,
          error: err instanceof Error ? err.message : 'An error occurred',
        });
      }
    };

    fetchExecutives();
  }, [companyId]);

  return state;
}



