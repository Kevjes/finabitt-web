'use client';

import { useState } from 'react';
import Input from '@/src/presentation/components/ui/Input';
import Select from '@/src/presentation/components/ui/Select';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';

interface TransactionFiltersProps {
  onFiltersChange: (filters: TransactionFilters) => void;
  accounts: Array<{ id: string; name: string }>;
  categories: Array<{ name: string }>;
}

interface TransactionFilters {
  searchTerm: string;
  selectedType: string;
  selectedCategory: string;
  selectedAccount: string;
  selectedStatus: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  onFiltersChange,
  accounts,
  categories
}) => {
  const [filters, setFilters] = useState<TransactionFilters>({
    searchTerm: '',
    selectedType: 'all',
    selectedCategory: '',
    selectedAccount: '',
    selectedStatus: '',
    dateRange: 'all'
  });

  const updateFilters = (newFilters: Partial<TransactionFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    { value: 'income', label: 'Revenus' },
    { value: 'expense', label: 'Dépenses' },
    { value: 'transfer', label: 'Virements' }
  ];

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'Toutes les dates' },
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'year', label: 'Cette année' }
  ];

  const accountOptions = [
    { value: '', label: 'Tous les comptes' },
    ...accounts.map(account => ({
      value: account.id,
      label: account.name
    }))
  ];

  const categoryOptions = [
    { value: '', label: 'Toutes les catégories' },
    ...categories.map(cat => ({
      value: cat.name,
      label: cat.name
    }))
  ];

  const clearFilters = () => {
    const clearedFilters: TransactionFilters = {
      searchTerm: '',
      selectedType: 'all',
      selectedCategory: '',
      selectedAccount: '',
      selectedStatus: '',
      dateRange: 'all'
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Ligne 1: Recherche */}
        <div>
          <Input
            placeholder="Rechercher une transaction..."
            value={filters.searchTerm}
            onChange={(value) => updateFilters({ searchTerm: value })}
            className="w-full"
          />
        </div>

        {/* Ligne 2: Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <Select
            value={filters.selectedType}
            onChange={(value) => updateFilters({ selectedType: value })}
            options={typeOptions}
            placeholder="Type"
          />
          <Select
            value={filters.selectedCategory}
            onChange={(value) => updateFilters({ selectedCategory: value })}
            options={categoryOptions}
            placeholder="Catégorie"
          />
          <Select
            value={filters.selectedAccount}
            onChange={(value) => updateFilters({ selectedAccount: value })}
            options={accountOptions}
            placeholder="Compte"
          />
          <Select
            value={filters.selectedStatus}
            onChange={(value) => updateFilters({ selectedStatus: value })}
            options={statusOptions}
            placeholder="Statut"
          />
          <Select
            value={filters.dateRange}
            onChange={(value) => updateFilters({ dateRange: value as any })}
            options={dateRangeOptions}
            placeholder="Période"
          />
        </div>

        {/* Filtres actifs */}
        {(filters.searchTerm || filters.selectedType !== 'all' || filters.selectedCategory ||
          filters.selectedAccount || filters.selectedStatus || filters.dateRange !== 'all') && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Filtres actifs:</span>
            {filters.searchTerm && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                Recherche: "{filters.searchTerm}"
              </span>
            )}
            {filters.selectedType !== 'all' && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                Type: {typeOptions.find(t => t.value === filters.selectedType)?.label}
              </span>
            )}
            {filters.selectedCategory && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                Catégorie: {filters.selectedCategory}
              </span>
            )}
            {filters.selectedAccount && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                Compte: {accounts.find(a => a.id === filters.selectedAccount)?.name}
              </span>
            )}
            {filters.selectedStatus && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                Statut: {statusOptions.find(s => s.value === filters.selectedStatus)?.label}
              </span>
            )}
            {filters.dateRange !== 'all' && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                Période: {dateRangeOptions.find(d => d.value === filters.dateRange)?.label}
              </span>
            )}
            <button
              onClick={clearFilters}
              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              ✕ Effacer tout
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TransactionFilters;