'use client';

import { useState } from 'react';
import { useHabits } from '@/src/presentation/hooks/useHabits';
import Button from '@/src/presentation/components/ui/Button';
import Input from '@/src/presentation/components/ui/Input';
import Textarea from '@/src/presentation/components/ui/Textarea';
import Select from '@/src/presentation/components/ui/Select';
import TimeInput from '@/src/presentation/components/ui/TimeInput';
import Card from '@/src/presentation/components/ui/Card';
import { HabitSchedule } from '@/src/shared/types';

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateHabitModal: React.FC<CreateHabitModalProps> = ({ isOpen, onClose }) => {
  const { createHabit, loading } = useHabits();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'good' as 'good' | 'bad',
    frequency: 'daily' as 'daily' | 'weekly' | 'custom',
    target: '',
    customDays: [] as string[],
    // Nouveaux champs pour les horaires
    hasTimeSchedule: false,
    dailyTimes: [] as string[],
    schedules: [] as HabitSchedule[],
    // Nouveaux champs pour l'impact financier
    hasFinancialImpact: false,
    estimatedCostPerOccurrence: '',
    // Champ pour créer automatiquement des tâches
    createAutomaticTasks: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const typeOptions = [
    { value: 'good', label: 'Bonne habitude (à acquérir)' },
    { value: 'bad', label: 'Mauvaise habitude (à abandonner)' }
  ];

  const frequencyOptions = [
    { value: 'daily', label: 'Quotidienne' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'custom', label: 'Jours personnalisés' }
  ];

  const dayOptions = [
    { value: 'monday', label: 'Lundi' },
    { value: 'tuesday', label: 'Mardi' },
    { value: 'wednesday', label: 'Mercredi' },
    { value: 'thursday', label: 'Jeudi' },
    { value: 'friday', label: 'Vendredi' },
    { value: 'saturday', label: 'Samedi' },
    { value: 'sunday', label: 'Dimanche' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de l\'habitude est requis';
    }

    if (formData.frequency === 'custom' && formData.customDays.length === 0) {
      newErrors.customDays = 'Veuillez sélectionner au moins un jour';
    }

    if (formData.hasTimeSchedule) {
      if (formData.frequency === 'daily') {
        if (formData.dailyTimes.length === 0) {
          newErrors.times = 'Veuillez ajouter au moins un horaire';
        }
      } else if (formData.frequency === 'custom') {
        const hasTimesForAllDays = formData.customDays.every(day =>
          formData.schedules.some(schedule =>
            schedule.day === day && schedule.times.length > 0
          )
        );
        if (!hasTimesForAllDays) {
          newErrors.schedules = 'Veuillez définir des horaires pour tous les jours sélectionnés';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Préparer les données en évitant les undefined
      const habitData: any = {
        name: formData.name.trim(),
        type: formData.type,
        frequency: formData.frequency,
        isActive: true,
        hasTimeSchedule: formData.hasTimeSchedule
      };

      // Ajouter les champs optionnels seulement s'ils ont des valeurs
      if (formData.description.trim()) {
        habitData.description = formData.description.trim();
      }

      if (formData.target.trim()) {
        habitData.target = formData.target.trim();
      }

      if (formData.frequency === 'custom' && formData.customDays.length > 0) {
        habitData.customDays = formData.customDays;
      }

      if (formData.hasTimeSchedule) {
        if (formData.frequency === 'daily' && formData.dailyTimes.length > 0) {
          habitData.dailyTimes = formData.dailyTimes;
        } else if (formData.frequency === 'custom' && formData.schedules.length > 0) {
          habitData.schedules = formData.schedules.filter(s => s.times.length > 0);
        }
      }

      if (formData.hasFinancialImpact) {
        habitData.hasFinancialImpact = true;
        if (formData.estimatedCostPerOccurrence.trim()) {
          habitData.estimatedCostPerOccurrence = parseFloat(formData.estimatedCostPerOccurrence);
        }
      }

      const success = await createHabit(habitData);

      if (success) {
        setFormData({
          name: '',
          description: '',
          type: 'good',
          frequency: 'daily',
          target: '',
          customDays: [],
          hasTimeSchedule: false,
          dailyTimes: [],
          schedules: [],
          hasFinancialImpact: false,
          estimatedCostPerOccurrence: '',
          createAutomaticTasks: true
        });
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      customDays: prev.customDays.includes(day)
        ? prev.customDays.filter(d => d !== day)
        : [...prev.customDays, day]
    }));
  };

  const addDailyTime = () => {
    const newTime = '09:00'; // Heure par défaut
    setFormData(prev => ({
      ...prev,
      dailyTimes: [...prev.dailyTimes, newTime]
    }));
  };

  const updateDailyTime = (index: number, time: string) => {
    setFormData(prev => ({
      ...prev,
      dailyTimes: prev.dailyTimes.map((t, i) => i === index ? time : t)
    }));
  };

  const removeDailyTime = (index: number) => {
    setFormData(prev => ({
      ...prev,
      dailyTimes: prev.dailyTimes.filter((_, i) => i !== index)
    }));
  };

  const addTimeToSchedule = (day: string) => {
    const newTime = '09:00';
    setFormData(prev => {
      const existingSchedule = prev.schedules.find(s => s.day === day);
      if (existingSchedule) {
        return {
          ...prev,
          schedules: prev.schedules.map(s =>
            s.day === day
              ? { ...s, times: [...s.times, newTime] }
              : s
          )
        };
      } else {
        return {
          ...prev,
          schedules: [...prev.schedules, { day, times: [newTime] }]
        };
      }
    });
  };

  const updateScheduleTime = (day: string, timeIndex: number, newTime: string) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.map(s =>
        s.day === day
          ? { ...s, times: s.times.map((t, i) => i === timeIndex ? newTime : t) }
          : s
      )
    }));
  };

  const removeScheduleTime = (day: string, timeIndex: number) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.map(s =>
        s.day === day
          ? { ...s, times: s.times.filter((_, i) => i !== timeIndex) }
          : s
      ).filter(s => s.times.length > 0) // Remove schedule if no times left
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md max-h-screen overflow-y-auto">
        <Card padding="lg" className="relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Nouvelle habitude
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nom de l'habitude *"
              value={formData.name}
              onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
              error={errors.name}
              placeholder="ex: Lire 10 pages par jour"
              required
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Décrivez votre habitude (optionnel)"
              rows={3}
            />

            <Select
              label="Type d'habitude *"
              value={formData.type}
              onChange={(value) => setFormData(prev => ({ ...prev, type: value as 'good' | 'bad' }))}
              options={typeOptions}
              required
            />

            <Select
              label="Fréquence *"
              value={formData.frequency}
              onChange={(value) => setFormData(prev => ({ ...prev, frequency: value as any }))}
              options={frequencyOptions}
              required
            />

            {formData.frequency === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Jours personnalisés *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {dayOptions.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleDayToggle(day.value)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        formData.customDays.includes(day.value)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                {errors.customDays && (
                  <p className="mt-1 text-sm text-error">{errors.customDays}</p>
                )}
              </div>
            )}

            <Input
              label="Objectif"
              value={formData.target}
              onChange={(value) => setFormData(prev => ({ ...prev, target: value }))}
              placeholder="ex: 10 pages, 30 minutes, 5 verres d'eau"
              helperText="Définissez un objectif mesurable (optionnel)"
            />

            {/* Time Schedule Toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasTimeSchedule}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasTimeSchedule: e.target.checked }))}
                  className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Définir des horaires spécifiques
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Programmez votre habitude à des heures précises
              </p>
            </div>

            {/* Time Schedule Configuration */}
            {formData.hasTimeSchedule && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {/* Daily Times for Daily Frequency */}
                {formData.frequency === 'daily' && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Horaires quotidiens
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDailyTime}
                        className="text-xs"
                      >
                        + Ajouter heure
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {formData.dailyTimes.map((time, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <TimeInput
                            value={time}
                            onChange={(newTime) => updateDailyTime(index, newTime)}
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeDailyTime(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {formData.dailyTimes.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          Cliquez sur "Ajouter heure" pour programmer vos horaires
                        </p>
                      )}
                    </div>

                    {errors.times && (
                      <p className="text-sm text-error">{errors.times}</p>
                    )}
                  </div>
                )}

                {/* Custom Schedules for Custom Days */}
                {formData.frequency === 'custom' && formData.customDays.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Horaires par jour
                    </label>

                    <div className="space-y-4">
                      {formData.customDays.map((day) => {
                        const daySchedule = formData.schedules.find(s => s.day === day) || { day, times: [] };
                        const dayLabel = dayOptions.find(opt => opt.value === day)?.label || day;

                        return (
                          <div key={day} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {dayLabel}
                              </h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addTimeToSchedule(day)}
                                className="text-xs"
                              >
                                + Heure
                              </Button>
                            </div>

                            <div className="space-y-2">
                              {daySchedule.times.map((time, timeIndex) => (
                                <div key={timeIndex} className="flex gap-2 items-center">
                                  <TimeInput
                                    value={time}
                                    onChange={(newTime) => updateScheduleTime(day, timeIndex, newTime)}
                                    className="flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeScheduleTime(day, timeIndex)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}

                              {daySchedule.times.length === 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                  Aucun horaire défini pour ce jour
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {errors.schedules && (
                      <p className="text-sm text-error">{errors.schedules}</p>
                    )}
                  </div>
                )}

                {formData.frequency === 'weekly' && (
                  <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">
                      Les horaires pour les habitudes hebdomadaires seront disponibles prochainement
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Financial Impact Section */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasFinancialImpact}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasFinancialImpact: e.target.checked }))}
                  className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cette habitude a un impact financier
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.type === 'bad'
                  ? 'Coût de cette mauvaise habitude (pour calculer les économies en l\'évitant)'
                  : 'Coût de cette bonne habitude (investissement dans votre bien-être)'
                }
              </p>
            </div>

            {/* Financial Cost Input */}
            {formData.hasFinancialImpact && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <Input
                  label={`Coût estimé par occurrence (FCFA)`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.estimatedCostPerOccurrence}
                  onChange={(value) => setFormData(prev => ({ ...prev, estimatedCostPerOccurrence: value }))}
                  placeholder="ex: 2500"
                  helperText={
                    formData.type === 'bad'
                      ? 'Montant que vous dépensez à chaque fois que vous cédez à cette habitude'
                      : 'Montant que vous investissez à chaque fois pour cette bonne habitude'
                  }
                />

                {formData.estimatedCostPerOccurrence && formData.frequency && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      💰 Impact financier estimé :
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {formData.frequency === 'daily' && `${(parseFloat(formData.estimatedCostPerOccurrence) * 30).toFixed(0)} FCFA par mois`}
                      {formData.frequency === 'weekly' && `${(parseFloat(formData.estimatedCostPerOccurrence) * 4).toFixed(0)} FCFA par mois`}
                      {formData.frequency === 'custom' && formData.customDays.length > 0 &&
                        `${(parseFloat(formData.estimatedCostPerOccurrence) * formData.customDays.length * 4).toFixed(0)} FCFA par mois`
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Automatic Task Creation */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.createAutomaticTasks}
                  onChange={(e) => setFormData(prev => ({ ...prev, createAutomaticTasks: e.target.checked }))}
                  className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Créer automatiquement des tâches récurrentes
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Une tâche sera automatiquement créée dans le module Tâches pour suivre cette habitude
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                fullWidth
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                fullWidth
                isLoading={isSubmitting}
                disabled={loading}
              >
                Créer l'habitude
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateHabitModal;