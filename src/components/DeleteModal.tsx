import React from 'react';

type DeleteModalProps = {
  title?: string;
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteModal({
  title = "Confirm Delete",
  message = "Are you sure you want to delete all tables?",
  onCancel,
  onConfirm,
}: DeleteModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-lg max-w-sm w-full">
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          {message}
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md text-white bg-red-500 hover:bg-red-600"
          >
            Yes, Delete All
          </button>
        </div>
      </div>
    </div>
  );
}