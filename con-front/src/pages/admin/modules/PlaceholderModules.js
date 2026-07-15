import React from 'react';

const ComingSoon = ({ moduleName }) => (
  <div className="p-6">
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{moduleName}</h1>
      <p className="text-gray-600">This module is under development</p>
      <p className="text-sm text-gray-500 mt-4">
        Follow the pattern from ItemsManagement.js, ItemChoicesManagement.js, ElementsManagement.js, and ComponentsManagement.js to implement this module
      </p>
    </div>
  </div>
);

// Note: Implemented modules are now in their own files
// - ItemsManagement.js
// - ItemChoicesManagement.js  
// - ElementsManagement.js
// - ElementItemMapping.js
// - ComponentsManagement.js (NEW!)

export const UnitsManagement = () => <ComingSoon moduleName="Units Management" />;
export const SystemSettings = () => <ComingSoon moduleName="System Settings" />;
