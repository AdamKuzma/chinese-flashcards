import React, { useState, useEffect } from 'react';
import { useFlashcardStore } from '../store';
import Button from './Button';

export const Profile: React.FC = () => {
  const { ttsSettings, updateTtsSettings, showAlgorithmDetails, updateShowAlgorithmDetails } = useFlashcardStore();
  
  // Local state for tracking changes
  const [localTtsSettings, setLocalTtsSettings] = useState(ttsSettings);
  const [localShowAlgorithmDetails, setLocalShowAlgorithmDetails] = useState(showAlgorithmDetails);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const ttsChanged = localTtsSettings.speakingRate !== ttsSettings.speakingRate;
    const algorithmChanged = localShowAlgorithmDetails !== showAlgorithmDetails;
    const hasChangesNow = ttsChanged || algorithmChanged;
    console.log('Change tracking:', {
      localTts: localTtsSettings.speakingRate,
      storeTts: ttsSettings.speakingRate,
      localAlgorithm: localShowAlgorithmDetails,
      storeAlgorithm: showAlgorithmDetails,
      ttsChanged,
      algorithmChanged,
      hasChangesNow
    });
    setHasChanges(hasChangesNow);
  }, [localTtsSettings, ttsSettings, localShowAlgorithmDetails, showAlgorithmDetails]);

  const handleSpeakingRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRate = parseFloat(event.target.value);
    setLocalTtsSettings({ speakingRate: newRate });
  };

  const handleAlgorithmDetailsToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalShowAlgorithmDetails(event.target.checked);
  };

  const handleSave = () => {
    console.log('Save button clicked!');
    console.log('Saving settings:', {
      ttsRate: localTtsSettings.speakingRate,
      algorithmDetails: localShowAlgorithmDetails
    });
    
    // Apply the changes
    updateTtsSettings({ speakingRate: localTtsSettings.speakingRate });
    updateShowAlgorithmDetails(localShowAlgorithmDetails);
    
    // Show toast
    console.log('Dispatching toast event...');
    window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Settings saved' }));
    
    // Reset local state to match the new store values
    setLocalTtsSettings({ speakingRate: localTtsSettings.speakingRate });
    setLocalShowAlgorithmDetails(localShowAlgorithmDetails);
    setHasChanges(false);
    
    console.log('Save completed');
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
            <span className="text-sm text-light-custom">{localTtsSettings.speakingRate}x</span>
          </div>
        </div>
        <div className="flex justify-start">
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.25"
            value={localTtsSettings.speakingRate}
            onChange={handleSpeakingRateChange}
            className="w-1/2 h-2 bg-granite-custom rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, var(--color-light) 0%, var(--color-light) ${((localTtsSettings.speakingRate - 0.5) / (1.5 - 0.5)) * 100}%, var(--color-granite) ${((localTtsSettings.speakingRate - 0.5) / (1.5 - 0.5)) * 100}%, var(--color-granite) 100%)`
            }}
          />
        </div>
      </div>

      <div className="mt-12">
        <div className="flex justify-start mb-4">
          <div className="flex justify-between items-center w-1/2">
            <label className="text-sm text-silver-custom">Show Algorithm Details</label>
            <input
              type="checkbox"
              checked={localShowAlgorithmDetails}
              onChange={handleAlgorithmDetailsToggle}
              className="w-4 h-4 text-light-custom bg-granite-custom border-granite-custom rounded focus:ring-light-custom focus:ring-2"
            />
          </div>
        </div>
        <div className="text-xs text-gray-custom text-left">
          When enabled, shows algorithm details link during card reviews
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-16 flex justify-start">
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          size="lg"
        >
          Save
        </Button>
      </div>

    </div>
  );
};

export default Profile;
