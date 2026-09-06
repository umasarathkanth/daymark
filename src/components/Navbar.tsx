import React from 'react';
import { 
  Home, 
  PenLine, 
  History, 
  Brain, 
  Settings, 
  Sparkles, 
  Activity, 
  User as UserIcon,
  LogOut,
  Zap
} from 'lucide-react';
import { UserProfile } from '../types';

export type NavTabType = 'home' | 'reflect' | 'timeline' | 'insights' | 'settings';

interface NavbarProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onContinueAsGuest?: () => void;
  onSignOut: () => void;
  onOpenActivity: () => void;
  onSeedDemo: () => void;
  isProcessing?: boolean;
  activeNudgesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  onOpenAuth,
  onContinueAsGuest,
  onSignOut,
  onOpenActivity,
  onSeedDemo,
  isProcessing = false,
  activeNudgesCount = 0
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Tagline */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => setActiveTab('home')}
          >
            <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center text-amber-100 shadow-xs group-hover:scale-105 transition-transform">
              <span className="font-serif font-black text-base text-amber-200 tracking-wider">D</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-sans text-base sm:text-lg font-bold tracking-[0.14em] text-stone-900 uppercase">
                  DAYMARK
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-serif italic hidden md:block">
                Make a mark on your day.
              </p>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-stone-100/90 p-1.5 rounded-xl border border-stone-200/60">
            
            {/* HOME */}
            <button
              id="nav-home-btn"
              onClick={() => setActiveTab('home')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'home'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/50'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Home className="w-4 h-4 text-amber-700" />
              <span>Home</span>
            </button>

            {/* REFLECT */}
            <button
              id="nav-reflect-btn"
              onClick={() => setActiveTab('reflect')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'reflect'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/50'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <PenLine className="w-4 h-4 text-amber-700" />
              <span>Reflect</span>
            </button>

            {/* TIMELINE */}
            <button
              id="nav-timeline-btn"
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'timeline'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/50'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <History className="w-4 h-4 text-amber-700" />
              <span>Timeline</span>
            </button>

            {/* INSIGHTS */}
            <button
              id="nav-insights-btn"
              onClick={() => setActiveTab('insights')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all relative ${
                activeTab === 'insights'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/50'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Brain className="w-4 h-4 text-amber-700" />
              <span>Insights</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </button>

            {/* SETTINGS */}
            <button
              id="nav-settings-btn"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/50'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Settings className="w-4 h-4 text-stone-500" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center space-x-2">
            
            {/* Quick Demo Seeder Button */}
            <button
              id="nav-seed-demo-btn"
              onClick={onSeedDemo}
              disabled={isProcessing}
              title="Preload 5-day longitudinal Avoidance & Progress arc"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg border border-amber-200/70 transition-colors shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Seed 5-Day Arc</span>
            </button>

            {/* AI Reasoning Trace Modal Trigger */}
            <button
              id="nav-ai-activity-btn"
              onClick={onOpenActivity}
              title="Inspect Gemini execution trace, model fallback ladder, and safety policies"
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs rounded-lg border border-stone-200/70 transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden xl:inline text-[11px] font-medium">Trace</span>
            </button>

            {/* Profile / Auth */}
            {userProfile ? (
              <div className="flex items-center space-x-2 pl-1">
                {userProfile.isGuest ? (
                  <div className="flex items-center space-x-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs">
                      Guest Mode
                    </span>
                    <button
                      id="nav-guest-signin-btn"
                      onClick={onOpenAuth}
                      className="text-xs font-semibold text-stone-800 hover:text-stone-900 underline underline-offset-2 px-1.5 py-1 rounded transition-colors"
                      title="Sign in with Firebase to save your reflections permanently"
                    >
                      Sign In
                    </button>
                    <button
                      id="nav-logout-btn"
                      onClick={onSignOut}
                      title="Exit Guest Session"
                      className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 font-bold text-xs" title={userProfile.displayName || userProfile.email}>
                      {(userProfile.displayName?.[0] || 'U').toUpperCase()}
                    </div>
                    <button
                      id="nav-logout-btn"
                      onClick={onSignOut}
                      title="Sign Out"
                      className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  id="nav-continue-guest-btn"
                  onClick={onContinueAsGuest}
                  className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg border border-stone-200 transition-colors"
                >
                  <span>Continue as Guest</span>
                </button>
                <button
                  id="nav-signin-btn"
                  onClick={onOpenAuth}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
