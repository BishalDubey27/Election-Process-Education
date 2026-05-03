import React from 'react';
import countriesData from '../data/countries.json';

const CountrySelector = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-in fade-in duration-700">
      <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
        Select Your Country to Begin
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {countriesData.map((country) => (
          <button
            key={country.id}
            onClick={() => onSelect(country)}
            className="group relative flex flex-col items-center p-8 rounded-2xl glass-morphism hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/20 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-6xl">{country.flag}</span>
            </div>
            <span className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
              {country.flag}
            </span>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-600 transition-colors">
              {country.label}
            </h3>
            <p className="text-sm text-muted-foreground">
              System: <span className="font-medium text-foreground">{country.system}</span>
            </p>
            <div className="mt-4 w-full h-1 bg-muted rounded-full overflow-hidden">
              <div className="w-0 group-hover:w-full h-full bg-primary-500 transition-all duration-500"></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CountrySelector;
