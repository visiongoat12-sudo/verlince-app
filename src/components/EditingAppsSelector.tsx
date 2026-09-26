import React, { useState } from 'react';
import { Film, Plus, X, Check, Video, Sparkles, Layers } from 'lucide-react';
import { soundEffects } from '../lib/soundEffects';

export const COMMON_EDITING_APPS = [
  'Adobe Premiere Pro',
  'DaVinci Resolve',
  'Final Cut Pro',
  'Adobe After Effects',
  'CapCut Desktop',
  'Blender',
  'Avid Media Composer',
  'Wondershare Filmora',
  'Sony Vegas Pro',
];

interface EditingAppsSelectorProps {
  selectedApps: string[];
  onChange: (apps: string[]) => void;
  readOnly?: boolean;
}

export const EditingAppsSelector: React.FC<EditingAppsSelectorProps> = ({
  selectedApps,
  onChange,
  readOnly = false,
}) => {
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleToggleApp = (appName: string) => {
    if (readOnly) return;
    soundEffects.playSubTabClick();
    if (selectedApps.includes(appName)) {
      onChange(selectedApps.filter((a) => a !== appName));
    } else {
      onChange([...selectedApps, appName]);
    }
  };

  const handleAddCustomApp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customInput.trim();
    if (!clean) return;
    if (!selectedApps.some((a) => a.toLowerCase() === clean.toLowerCase())) {
      soundEffects.playSubTabClick();
      onChange([...selectedApps, clean]);
    }
    setCustomInput('');
    setShowCustomInput(false);
  };

  const handleRemoveApp = (appName: string) => {
    if (readOnly) return;
    soundEffects.playSubTabClick();
    onChange(selectedApps.filter((a) => a !== appName));
  };

  if (readOnly) {
    if (!selectedApps || selectedApps.length === 0) {
      return (
        <span className="text-xs text-slate-500 italic">No editing software listed</span>
      );
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        {selectedApps.map((app) => (
          <span
            key={app}
            className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono font-medium flex items-center gap-1.5 shadow-sm shadow-teal-500/5"
          >
            <Film className="w-3 h-3 text-teal-400 shrink-0" />
            <span>{app}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Popular Preset Toggles */}
      <div className="flex flex-wrap gap-2">
        {COMMON_EDITING_APPS.map((app) => {
          const isSelected = selectedApps.includes(app);
          return (
            <button
              key={app}
              type="button"
              onClick={() => handleToggleApp(app)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-teal-500/20 border-teal-400 text-teal-200 shadow-md shadow-teal-500/10 scale-[1.02]'
                  : 'bg-[#141822] border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
              }`}
            >
              {isSelected ? (
                <Check className="w-3.5 h-3.5 text-teal-400" />
              ) : (
                <Film className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{app}</span>
            </button>
          );
        })}
      </div>

      {/* Custom App addition */}
      <div className="flex items-center gap-2 pt-1">
        {showCustomInput ? (
          <form onSubmit={handleAddCustomApp} className="flex items-center gap-2 flex-1 max-w-sm">
            <input
              type="text"
              autoFocus
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="e.g. Cinema 4D, Nuke, HitFilm..."
              className="flex-1 px-3 py-1.5 bg-[#141822] border border-teal-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowCustomInput(false)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium transition py-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add other editing software...</span>
          </button>
        )}
      </div>

      {/* Selected tags list with remove button if any custom tags */}
      {selectedApps.length > 0 && (
        <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-slate-500 font-mono uppercase mr-1">Active Suite:</span>
          {selectedApps.map((app) => (
            <span
              key={app}
              className="px-2 py-0.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-mono flex items-center gap-1"
            >
              <span>{app}</span>
              <button
                type="button"
                onClick={() => handleRemoveApp(app)}
                className="hover:text-red-400 p-0.5"
                title={`Remove ${app}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
