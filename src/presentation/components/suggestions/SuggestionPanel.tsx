'use client';

import { useState } from 'react';
import { useSuggestions } from '@/src/presentation/hooks/useSuggestions';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';

interface SuggestionPanelProps {
  className?: string;
  maxSuggestions?: number;
}

const SuggestionPanel: React.FC<SuggestionPanelProps> = ({ className = '', maxSuggestions = 5 }) => {
  const { suggestions, notifications, loading } = useSuggestions();

  if (loading) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Chargement des suggestions...</div>
        </div>
      </Card>
    );
  }

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending').slice(0, maxSuggestions);
  const unreadNotifications = notifications.filter(n => !n.isRead).slice(0, 3);

  if (pendingSuggestions.length === 0 && unreadNotifications.length === 0) {
    return (
      <Card className={className}>
        <div className="text-center py-6">
          <div className="text-4xl mb-2">✨</div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Tout est à jour !
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Aucune nouvelle suggestion pour le moment
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {pendingSuggestions.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              💡 Suggestions intelligentes
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {pendingSuggestions.length} en attente
            </span>
          </div>

          <div className="space-y-3">
            {pendingSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {suggestion.title}
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                      {suggestion.description}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      Accepter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-gray-50 text-gray-700 border-gray-200"
                    >
                      Ignorer
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {unreadNotifications.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              🔔 Notifications
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {unreadNotifications.length} non lues
            </span>
          </div>

          <div className="space-y-3">
            {unreadNotifications.map((notification) => (
              <div
                key={notification.id}
                className="p-3 rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-900/20 dark:border-gray-700"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {notification.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SuggestionPanel;