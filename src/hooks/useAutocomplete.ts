'use client';

import { useState, useCallback } from 'react';

interface AutocompleteRequestOptions {
  includedRegionCodes?: string[];
  // Add other options from AutocompleteRequest as needed
}

export const useAutocomplete = () => {
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async (query: string, options?: AutocompleteRequestOptions) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { AutocompleteSuggestion } = (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary;
      const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
        ...options,
        input: query,
      });
      setSuggestions(suggestions);
    } catch (e) {
      setError('Failed to fetch suggestions.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { suggestions, loading, error, fetchSuggestions, setSuggestions };
};
