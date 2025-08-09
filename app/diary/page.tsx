'use client';

import { useState, useRef } from 'react';

interface DiaryEntry {
  date: string;
  mood: number;
  energy: number;
  goals: string[];
  achievements: string[];
  reflections: string;
}

export default function PerformanceDiaryPage() {
  const [currentEntry, setCurrentEntry] = useState<Partial<DiaryEntry>>({
    mood: 5,
    energy: 5,
    goals: [],
    achievements: [],
    reflections: '',
  });
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  const [coachResponse, setCoachResponse] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  const addGoal = () => {
    if (newGoal.trim()) {
      setCurrentEntry(prev => ({
        ...prev,
        goals: [...(prev.goals || []), newGoal.trim()]
      }));
      setNewGoal('');
    }
  };

  const removeGoal = (index: number) => {
    setCurrentEntry(prev => ({
      ...prev,
      goals: prev.goals?.filter((_, i) => i !== index) || []
    }));
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setCurrentEntry(prev => ({
        ...prev,
        achievements: [...(prev.achievements || []), newAchievement.trim()]
      }));
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    setCurrentEntry(prev => ({
      ...prev,
      achievements: prev.achievements?.filter((_, i) => i !== index) || []
    }));
  };

  const saveDiaryEntry = async () => {
    try {
      const response = await fetch('/api/sports-coach/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          entry: currentEntry,
        }),
      });

      const data = await response.json();
      
      if (data.diaryEntry) {
        setEntries(prev => [data.diaryEntry, ...prev]);
        setCoachResponse(data.response);
        
        // Play voice response
        if (data.voiceResponse && audioRef.current) {
          const audioBlob = new Blob([Uint8Array.from(atob(data.voiceResponse), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        }
        
        // Reset current entry
        setCurrentEntry({
          mood: 5,
          energy: 5,
          goals: [],
          achievements: [],
          reflections: '',
        });
      }
    } catch (error) {
      console.error('Error saving diary entry:', error);
    }
  };

  const getMoodEmoji = (mood: number) => {
    if (mood <= 2) return '😢';
    if (mood <= 4) return '😕';
    if (mood <= 6) return '😐';
    if (mood <= 8) return '😊';
    return '😄';
  };

  const getEnergyColor = (energy: number) => {
    if (energy <= 3) return 'text-red-500';
    if (energy <= 6) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-900 mb-2">Performance Diary</h1>
          <p className="text-lg text-purple-700">Track your fitness journey and reflect with your AI coach</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Entry Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Today&apos;s Entry</h2>
            
            <div className="space-y-6">
              {/* Mood */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mood: {getMoodEmoji(currentEntry.mood || 5)} ({currentEntry.mood}/10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentEntry.mood || 5}
                  onChange={(e) => setCurrentEntry(prev => ({ ...prev, mood: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Energy */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Energy Level: <span className={getEnergyColor(currentEntry.energy || 5)}>({currentEntry.energy}/10)</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentEntry.energy || 5}
                  onChange={(e) => setCurrentEntry(prev => ({ ...prev, energy: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Goals */}
              <div>
                <label className="block text-sm font-medium mb-2">Goals for Today</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                    placeholder="Add a goal..."
                    className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={addGoal}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {currentEntry.goals?.map((goal, index) => (
                    <div key={index} className="flex items-center justify-between bg-purple-50 px-3 py-2 rounded">
                      <span>{goal}</span>
                      <button
                        onClick={() => removeGoal(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div>
                <label className="block text-sm font-medium mb-2">Today&apos;s Achievements</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
                    placeholder="Add an achievement..."
                    className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={addAchievement}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {currentEntry.achievements?.map((achievement, index) => (
                    <div key={index} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded">
                      <span>🎉 {achievement}</span>
                      <button
                        onClick={() => removeAchievement(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reflections */}
              <div>
                <label className="block text-sm font-medium mb-2">Reflections</label>
                <textarea
                  value={currentEntry.reflections || ''}
                  onChange={(e) => setCurrentEntry(prev => ({ ...prev, reflections: e.target.value }))}
                  placeholder="How did today go? What did you learn?"
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={saveDiaryEntry}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                Save Entry & Get Coach Feedback
              </button>
            </div>
          </div>

          {/* Coach Response & Previous Entries */}
          <div className="space-y-6">
            {/* Coach Response */}
            {coachResponse && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Coach Feedback</h3>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <p className="text-blue-800">{coachResponse}</p>
                </div>
              </div>
            )}

            {/* Previous Entries */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Entries</h3>
              
              {entries.length === 0 ? (
                <p className="text-gray-500 italic">No entries yet. Start by adding your first diary entry!</p>
              ) : (
                <div className="space-y-4">
                  {entries.slice(0, 3).map((entry, index) => (
                    <div key={index} className="border-l-4 border-purple-400 pl-4 pb-4">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-medium">{entry.date}</span>
                        <span>{getMoodEmoji(entry.mood)} Mood: {entry.mood}/10</span>
                        <span className={`${getEnergyColor(entry.energy)} font-medium`}>
                          Energy: {entry.energy}/10
                        </span>
                      </div>
                      
                      {entry.goals.length > 0 && (
                        <div className="mb-2">
                          <strong>Goals:</strong> {entry.goals.join(', ')}
                        </div>
                      )}
                      
                      {entry.achievements.length > 0 && (
                        <div className="mb-2">
                          <strong>Achievements:</strong> {entry.achievements.join(', ')}
                        </div>
                      )}
                      
                      {entry.reflections && (
                        <div>
                          <strong>Reflections:</strong> {entry.reflections}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Hidden audio element */}
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
}