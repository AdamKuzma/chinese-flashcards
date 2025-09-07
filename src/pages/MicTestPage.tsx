import { useNavigate } from 'react-router-dom';
import MicWaveform from '../components/MicWaveform';
import Button from '../components/Button';

export const MicTestPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          onClick={() => navigate('/')}
          variant="secondary"
          size="sm"
          className="mb-4"
        >
          ← Back to App
        </Button>
        <h1 className="text-2xl text-light-custom mb-2">MicWaveform Test</h1>
        <p className="text-gray-custom">
          This page tests the MicWaveform component. Speak into your microphone to see the live audio levels.
        </p>
      </div>

      <div className="bg-granite-custom rounded-lg p-6 mb-6">
        <h2 className="text-lg text-light-custom mb-4">Default Settings</h2>
        <MicWaveform />
      </div>

      <div className="bg-granite-custom rounded-lg p-6 mb-6">
        <h2 className="text-lg text-light-custom mb-4">Sharp Response (Low Smoothing)</h2>
        <MicWaveform 
          smoothing={0.1}
          maxGain={1}
          barWidth={3}
        />
      </div>

      <div className="bg-granite-custom rounded-lg p-6 mb-6">
        <h2 className="text-lg text-light-custom mb-4">Very Sharp (No Smoothing)</h2>
        <MicWaveform 
          smoothing={0.0}
          maxGain={3.0}
          barWidth={1}
          gap={0}
        />
      </div>

      {/* <div className="bg-granite-custom rounded-lg p-6 mb-6">
        <h2 className="text-lg text-light-custom mb-4">Custom Settings</h2>
        <MicWaveform
          width={400}
          height={60}
          barColor="#F5B206"
          barWidth={4}
          gap={3}
          speedPxPerSec={80}
          smoothing={0.8}
          maxGain={2.0}
        />
      </div>

      <div className="bg-granite-custom rounded-lg p-6">
        <h2 className="text-lg text-light-custom mb-4">Wide Format</h2>
        <MicWaveform
          width={600}
          height={40}
          barColor="#A0C700"
          barWidth={2}
          gap={1}
          speedPxPerSec={100}
        />
      </div> */}
    </div>
  );
};
