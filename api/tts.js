import { TextToSpeechClient } from '@google-cloud/text-to-speech';

export default async function handler(req, res) {
  // Handle CORS for localhost development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Initialize the TTS client with credentials from environment variables
    const client = new TextToSpeechClient({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`
      }
    });

    // Configure the TTS request
    const request = {
      input: { text },
      voice: {
        languageCode: 'zh-CN',
        // Use a valid Chinese voice (Wavenet voices may not be available in all regions)
        ssmlGender: 'FEMALE',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.9, // Slightly slower for learning
        pitch: 0.0,
        volumeGainDb: 0.0,
      },
    };

    // Generate the audio
    const [response] = await client.synthesizeSpeech(request);

    // Set proper headers for audio response
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', response.audioContent.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Send the audio data
    res.status(200).send(response.audioContent);

  } catch (error) {
    console.error('TTS Error:', error);
    
    // More detailed error logging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      projectId: process.env.GOOGLE_PROJECT_ID ? 'Set' : 'Missing',
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL ? 'Set' : 'Missing',
      privateKey: process.env.GOOGLE_PRIVATE_KEY ? 'Set' : 'Missing'
    });
    
    res.status(500).json({ 
      error: 'Failed to generate speech',
      details: error.message,
      debugInfo: {
        hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
        hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
        errorType: error.constructor.name
      }
    });
  }
}
