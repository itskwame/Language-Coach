
import React from 'react';
import { type Settings } from '../types';

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
}

const languages = ['Spanish', 'French', 'German', 'Italian', 'Japanese', 'Chinese (Mandarin)', 'English'];
const ageGroups = ['Child (4-12)', 'Teen (13-17)', 'Young Adult (18-24)', 'Adult (25-64)', 'Senior (65+)'];

const SelectInput: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  id: string;
}> = ({ label, value, onChange, options, id }) => (
  <div className="flex flex-col">
    <label htmlFor={id} className="mb-2 text-sm font-medium text-slate-300">{label}</label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 md:p-8 space-y-8 bg-slate-800">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Welcome to Lingua Coach!</h2>
        <p className="text-slate-400 mt-2">Let's set up your personalized lesson.</p>
      </div>
      <div className="w-full max-w-md space-y-6">
        <SelectInput
          id="target-language"
          label="I want to learn..."
          value={settings.targetLanguage}
          onChange={(e) => onSettingsChange({ targetLanguage: e.target.value })}
          options={languages}
        />
        <SelectInput
          id="native-language"
          label="My native language is..."
          value={settings.nativeLanguage}
          onChange={(e) => onSettingsChange({ nativeLanguage: e.target.value })}
          options={languages}
        />
        <SelectInput
          id="age-group"
          label="I am in the age group..."
          value={settings.ageGroup}
          onChange={(e) => onSettingsChange({ ageGroup: e.target.value })}
          options={ageGroups}
        />
      </div>
    </div>
  );
};
