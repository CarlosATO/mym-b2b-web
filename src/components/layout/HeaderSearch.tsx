import React from 'react';

export default function HeaderSearch() {
  return (
    <div className="hidden md:flex flex-1 max-w-md mx-4 relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </div>
      <input 
        type="text" 
        placeholder="Buscar productos..." 
        className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg text-sm focus:outline-none focus:ring-0 focus:bg-white transition-all placeholder:text-slate-500"
      />
    </div>
  );
}
