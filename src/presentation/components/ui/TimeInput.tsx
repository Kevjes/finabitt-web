import { forwardRef } from 'react';

interface TimeInputProps {
  label?: string;
  value: string;
  onChange: (time: string) => void;
  error?: string;
  className?: string;
  required?: boolean;
}

const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  ({ label, value, onChange, error, className = '', required }, ref) => {

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label} {required && <span className="text-error">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type="time"
          value={value}
          onChange={handleTimeChange}
          className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
            error
              ? 'border-error focus:ring-error focus:border-error'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          } ${className}`}
          required={required}
        />
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

TimeInput.displayName = 'TimeInput';

export default TimeInput;