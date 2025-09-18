'use client';

import { useState, KeyboardEvent } from 'react';
import Button from './Button';

interface TagInputProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  className?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  label,
  value = [],
  onChange,
  placeholder = "Appuyez sur Entrée pour ajouter",
  helperText,
  error,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tagText: string) => {
    const trimmedTag = tagText.trim();
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Gestion automatique des virgules
    if (newValue.includes(',')) {
      const newTags = newValue.split(',').map(tag => tag.trim()).filter(Boolean);
      newTags.forEach(tag => {
        if (!value.includes(tag)) {
          onChange([...value, tag]);
        }
      });
      setInputValue('');
    } else {
      setInputValue(newValue);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      <div className={`w-full p-2 border rounded-lg bg-white dark:bg-gray-800 transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:border-primary ${
        error
          ? 'border-error focus-within:ring-error focus-within:border-error'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      }`}>

        {/* Tags existants */}
        <div className="flex flex-wrap gap-1 mb-2">
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-primary/60 hover:text-primary/80 ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {/* Input pour nouveau tag */}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-gray-900 dark:text-gray-100 text-sm outline-none"
        />
      </div>

      {error && (
        <p className="mt-1 text-sm text-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
};

export default TagInput;