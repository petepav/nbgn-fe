import { useState, useEffect } from 'react';

const TERMS_ACCEPTANCE_KEY = 'nbgn_terms_accepted';
const TERMS_VERSION = '1.0'; // Update this when terms change

export const useTermsAcceptance = () => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTermsAcceptance = () => {
      try {
        const storedAcceptance = localStorage.getItem(TERMS_ACCEPTANCE_KEY);
        if (storedAcceptance) {
          const parsedAcceptance = JSON.parse(storedAcceptance);
          // Check if the stored version matches current version
          const hasValidAcceptance = 
            parsedAcceptance.version === TERMS_VERSION && 
            parsedAcceptance.accepted === true;
          setHasAcceptedTerms(hasValidAcceptance);
        } else {
          setHasAcceptedTerms(false);
        }
      } catch {
        // If parsing fails, treat as not accepted
        setHasAcceptedTerms(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTermsAcceptance();
  }, []);

  const acceptTerms = () => {
    try {
      const acceptance = {
        accepted: true,
        version: TERMS_VERSION,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(TERMS_ACCEPTANCE_KEY, JSON.stringify(acceptance));
      setHasAcceptedTerms(true);
    } catch {
      // Handle localStorage errors (e.g., in private browsing)
      console.warn('Failed to save terms acceptance to localStorage');
    }
  };

  const declineTerms = () => {
    try {
      localStorage.removeItem(TERMS_ACCEPTANCE_KEY);
      setHasAcceptedTerms(false);
    } catch {
      // Handle localStorage errors
      console.warn('Failed to clear terms acceptance from localStorage');
    }
  };

  return {
    hasAcceptedTerms,
    isLoading,
    acceptTerms,
    declineTerms
  };
};