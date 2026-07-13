import React from 'react';

export const MealmeLogo: React.FC = () => (
  <div className="flex items-center justify-center xl:justify-start gap-2 select-none">
    <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
      <img src="/mealme.png" alt="Mealme Logo" className="w-full h-full object-cover" />
    </div>
    <span className="hidden xl:inline text-2xl font-black text-pink-600 tracking-tight">Mealme :🥗)</span>
  </div>
);
