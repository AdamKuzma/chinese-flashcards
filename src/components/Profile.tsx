import React from 'react';
import { useFlashcardStore } from '../store';

export const Profile: React.FC = () => {
  const { ttsSettings, updateTtsSettings } = useFlashcardStore();

  const handleSpeakingRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRate = parseFloat(event.target.value);
    updateTtsSettings({ speakingRate: newRate });
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto -mr-8 pr-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-left">Profile</h1>
      </div>
      
      <div className="mt-16">
        <div className="flex justify-start mb-4">
          <div className="flex justify-between items-center w-1/2">
            <label className="text-sm text-silver-custom">Speech Speed</label>
            <span className="text-sm text-light-custom">{ttsSettings.speakingRate}x</span>
          </div>
        </div>
        <div className="flex justify-start">
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.25"
            value={ttsSettings.speakingRate}
            onChange={handleSpeakingRateChange}
            className="w-1/2 h-2 bg-granite-custom rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, var(--color-light) 0%, var(--color-light) ${((ttsSettings.speakingRate - 0.5) / (1.5 - 0.5)) * 100}%, var(--color-granite) ${((ttsSettings.speakingRate - 0.5) / (1.5 - 0.5)) * 100}%, var(--color-granite) 100%)`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Profile;
