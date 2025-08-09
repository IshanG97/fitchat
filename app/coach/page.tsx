'use client';

import { useState, useRef, useEffect } from 'react';

interface BiometricData {
  heartRate: number;
  steps: number;
  sleepHours: number;
  recoveryScore: number;
  fatigueLevel: number;
}


export default function SportsCoachPage() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'coach'; content: string; audio?: string }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [biometrics, setBiometrics] = useState<BiometricData>({
    heartRate: 72,
    steps: 8543,
    sleepHours: 7.5,
    recoveryScore: 8,
    fatigueLevel: 3,
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    // Initialize camera
    initializeCamera();
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { role: 'user' as const, content: message };
    setConversation(prev => [...prev, userMessage]);
    setMessage('');

    try {
      const response = await fetch('/api/sports-coach/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          message,
          biometrics,
          context: { conversation: conversation.slice(-5) },
        }),
      });

      const data = await response.json();
      
      if (data.textResponse) {
        const coachMessage = { 
          role: 'coach' as const, 
          content: data.textResponse,
          audio: data.voiceResponse 
        };
        setConversation(prev => [...prev, coachMessage]);
        
        // Play voice response
        if (data.voiceResponse && audioRef.current) {
          const audioBlob = new Blob([Uint8Array.from(atob(data.voiceResponse), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { role: 'coach' as const, content: 'Sorry, I encountered an error. Please try again.' };
      setConversation(prev => [...prev, errorMessage]);
    }
  };

  const analyzeForm = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsAnalyzing(true);
    
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg');
        
        const response = await fetch('/api/sports-coach/analyze-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'demo-user',
            videoData: imageData,
            exerciseType: 'general',
          }),
        });

        const data = await response.json();
        
        if (data.analysis) {
          const analysisMessage = { 
            role: 'coach' as const, 
            content: data.analysis,
            audio: data.voiceResponse 
          };
          setConversation(prev => [...prev, analysisMessage]);
          
          if (data.voiceResponse && audioRef.current) {
            const audioBlob = new Blob([Uint8Array.from(atob(data.voiceResponse), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            audioRef.current.src = audioUrl;
            audioRef.current.play();
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing form:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTrainingPlan = async () => {
    try {
      const response = await fetch('/api/sports-coach/training-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          biometrics,
          location: 'New York',
        }),
      });

      const data = await response.json();
      
      if (data.motivationalMessage) {
        const planMessage = { 
          role: 'coach' as const, 
          content: `${data.motivationalMessage}\n\nBased on current conditions, I recommend: ${data.weatherExercises?.join(', ')}`,
          audio: data.voiceResponse 
        };
        setConversation(prev => [...prev, planMessage]);
        
        if (data.voiceResponse && audioRef.current) {
          const audioBlob = new Blob([Uint8Array.from(atob(data.voiceResponse), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Error getting training plan:', error);
    }
  };

  const updateBiometric = (key: keyof BiometricData, value: number) => {
    setBiometrics(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">FitChat AI Sports Coach</h1>
          <p className="text-lg text-indigo-700">Your personal AI fitness companion with real-time feedback</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation Panel */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Chat with Your Coach</h2>
            
            <div className="h-96 overflow-y-auto mb-4 border rounded-lg p-4 bg-gray-50">
              {conversation.length === 0 && (
                <p className="text-gray-500 italic">Start a conversation with your AI coach...</p>
              )}
              {conversation.map((msg, idx) => (
                <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-3 rounded-lg max-w-xs ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    <strong>{msg.role === 'user' ? 'You' : 'Coach'}:</strong>
                    <p className="mt-1">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask your coach anything..."
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={sendMessage}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Send
              </button>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={getTrainingPlan}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Get Training Plan
              </button>
            </div>
          </div>

          {/* Biometrics & Controls Panel */}
          <div className="space-y-6">
            {/* Biometrics */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Biometrics</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Heart Rate: {biometrics.heartRate} bpm</label>
                  <input
                    type="range"
                    min="40"
                    max="200"
                    value={biometrics.heartRate}
                    onChange={(e) => updateBiometric('heartRate', Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Steps: {biometrics.steps.toLocaleString()}</label>
                  <input
                    type="range"
                    min="0"
                    max="20000"
                    value={biometrics.steps}
                    onChange={(e) => updateBiometric('steps', Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Sleep: {biometrics.sleepHours}h</label>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="0.5"
                    value={biometrics.sleepHours}
                    onChange={(e) => updateBiometric('sleepHours', Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Recovery Score: {biometrics.recoveryScore}/10</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={biometrics.recoveryScore}
                    onChange={(e) => updateBiometric('recoveryScore', Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Fatigue Level: {biometrics.fatigueLevel}/10</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={biometrics.fatigueLevel}
                    onChange={(e) => updateBiometric('fatigueLevel', Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Form Analysis */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Form Analysis</h2>
              
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full rounded-lg"
                  style={{ maxHeight: '200px' }}
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                <button
                  onClick={analyzeForm}
                  disabled={isAnalyzing}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Form'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Hidden audio element for voice responses */}
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
}