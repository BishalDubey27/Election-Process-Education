import React from 'react';
import countries from '../data/countries.json';
import { Globe } from 'lucide-react';

const CountrySelector = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {countries.map((country) => (
        <button
          key={country.id}
          onClick={() => onSelect(country)}
          className="group relative overflow-hidden rounded-3xl p-1 bg-gradient-to-br from-white/50 to-white/10 border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 text-left"
        >
          <div className="relative z-10 bg-white/40 backdrop-blur-xl rounded-[22px] p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl filter drop-shadow-md group-hover:scale-125 transition-transform duration-500">{country.flag}</span>
                <Globe className="w-5 h-5 text-primary-500/50" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">{country.label}</h3>
              <p className="text-sm text-slate-500 font-medium">System: {country.system}</p>
            </div>
            
            <div className="mt-6 flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Explore Process →
            </div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </button>
      ))}
    </div>
  );
};

export default CountrySelector;
