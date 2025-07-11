import { useTranslation } from 'react-i18next';

export const formatNBGN = (value: string | number, language: string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0,00 лв.';
  
  // Format with Bulgarian locale for comma decimal separator
  const formatted = numValue.toLocaleString('bg-BG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  // Add currency suffix based on language
  if (language === 'bg') {
    return `${formatted} лв.`;
  } else {
    // For other languages, show NBGN
    return `${numValue.toFixed(2)} NBGN`;
  }
};

// Hook version for components
export const useNBGNFormatter = () => {
  const { i18n } = useTranslation();
  
  return (value: string | number) => formatNBGN(value, i18n.language);
};