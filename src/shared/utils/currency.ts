export const SUPPORTED_CURRENCIES = [
  { value: 'FCFA', label: 'Franc CFA (FCFA)', symbol: 'FCFA' },
  { value: 'USD', label: 'Dollar américain ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' }
];

export type Currency = 'FCFA' | 'USD' | 'EUR';

export const DEFAULT_CURRENCY: Currency = 'FCFA';

export const getCurrencySymbol = (currency: Currency): string => {
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.value === currency);
  return currencyInfo?.symbol || currency;
};

export const formatAmount = (amount: number, currency: Currency): string => {
  const symbol = getCurrencySymbol(currency);

  // Pour le FCFA, on affiche le symbole après le montant
  if (currency === 'FCFA') {
    return `${amount.toLocaleString('fr-FR')} ${symbol}`;
  }

  // Pour USD et EUR, on affiche le symbole avant
  return `${symbol}${amount.toLocaleString('fr-FR')}`;
};