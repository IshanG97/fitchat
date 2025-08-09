export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-indigo-900">FitChat AI Sports Coach</h1>
          <p className="text-indigo-600 mt-2">Your personal AI fitness companion powered by ElevenLabs</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Transform Your Fitness Journey with AI
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get real-time voice feedback, personalized training plans, form analysis, and motivational support - all powered by advanced AI technology.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-3">Real-time Coaching</h3>
            <p className="text-gray-600 mb-4">
              Get instant voice feedback during workouts based on your biometrics and performance data.
            </p>
            <a 
              href="/coach"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-block"
            >
              Start Coaching
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3">Form Analysis</h3>
            <p className="text-gray-600 mb-4">
              Use your camera to get AI-powered analysis of your exercise form and technique.
            </p>
            <a 
              href="/coach"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors inline-block"
            >
              Analyze Form
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-3">Performance Diary</h3>
            <p className="text-gray-600 mb-4">
              Track your progress, goals, and reflections with personalized AI feedback.
            </p>
            <a 
              href="/diary"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-block"
            >
              Open Diary
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-4">🏋️</div>
            <h3 className="text-xl font-semibold mb-3">Dynamic Training Plans</h3>
            <p className="text-gray-600 mb-4">
              Get personalized workouts that adapt to your recovery, fatigue, and fitness level.
            </p>
            <a 
              href="/coach"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Get Plan
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-4">🌤️</div>
            <h3 className="text-xl font-semibold mb-3">Weather-Based Workouts</h3>
            <p className="text-gray-600 mb-4">
              Receive exercise recommendations based on current weather conditions.
            </p>
            <a 
              href="/coach"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors inline-block"
            >
              Get Suggestions
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-3">WhatsApp Integration</h3>
            <p className="text-gray-600 mb-4">
              Chat with your AI coach directly through WhatsApp with voice messages.
            </p>
            <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-center">
              Coming Soon
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Start Your AI-Powered Fitness Journey?</h3>
          <p className="text-lg mb-6">Experience personalized coaching with real-time voice feedback</p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/coach"
              className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Coaching Now
            </a>
            <a 
              href="/diary"
              className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors"
            >
              Track Progress
            </a>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Powered by</h3>
          <div className="flex justify-center items-center gap-8 text-gray-500">
            <span>ElevenLabs AI Voice</span>
            <span>•</span>
            <span>Next.js</span>
            <span>•</span>
            <span>TensorFlow</span>
            <span>•</span>
            <span>WhatsApp API</span>
          </div>
        </div>
      </main>
    </div>
  );
}