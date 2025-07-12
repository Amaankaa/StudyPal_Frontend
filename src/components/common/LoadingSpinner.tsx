import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <div className="mt-4 text-center">
          <div className="text-lg font-medium text-gray-700">Loading...</div>
          <div className="text-sm text-gray-500">Please wait</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 