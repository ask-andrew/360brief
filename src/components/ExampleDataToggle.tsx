'use client';

import { Switch } from '@headlessui/react';
import { useUserPreferences } from '@/context/UserPreferencesContext';

export function ExampleDataToggle() {
  const { isUsingExampleData, toggleExampleData } = useUserPreferences();

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {isUsingExampleData ? 'Example Data' : 'Your Data'}
      </span>
      <Switch
        checked={isUsingExampleData}
        onChange={toggleExampleData}
        className={`${
          isUsingExampleData ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      >
        <span className="sr-only">Toggle example data</span>
        <span
          className={`${
            isUsingExampleData ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </Switch>
    </div>
  );
}

export function ExampleDataBanner() {
  const { isUsingExampleData, toggleExampleData } = useUserPreferences();

  if (!isUsingExampleData) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 mb-6 rounded-r">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-blue-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-blue-700 dark:text-blue-200">
            You're currently viewing example data. Connect your accounts to see your personalized dashboard.
          </p>
          <div className="mt-2">
            <button
              type="button"
              onClick={() => toggleExampleData(false)}
              className="text-sm font-medium text-blue-700 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200"
            >
              Hide example data <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
