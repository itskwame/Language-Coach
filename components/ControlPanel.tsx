
import React from 'react';
import { SessionState } from '../types';

interface ControlPanelProps {
  sessionState: SessionState;
  isMuted: boolean;
  onStart: () => void;
  onStop: () => void;
  onMuteToggle: () => void;
}

const MicIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" x2="12" y1="19" y2="22"></line>
  </svg>
);

const MicOffIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="2" y1="2" x2="22" y2="22"></line>
        <path d="M18.89 13.23A7.12 7.12 0 0 1 19 12v-2"></path>
        <path d="M5 10v2a7 7 0 0 0 12 5"></path>
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 .8.2"></path>
        <path d="M9 9v3a3 3 0 0 0 3 3"></path>
        <line x1="12" x2="12" y1="19" y2="22"></line>
    </svg>
);


const StopIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="18" height="18" x="3" y="3" rx="2"></rect>
    </svg>
);


const getStatusIndicator = (state: SessionState) => {
    switch (state) {
        case SessionState.IDLE:
            return <span className="text-slate-400">Ready to start</span>;
        case SessionState.CONNECTING:
            return <span className="text-yellow-400 animate-pulse">Connecting...</span>;
        case SessionState.ACTIVE:
            return <span className="text-green-400 flex items-center"><span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>Live</span>;
        default:
            return null;
    }
}


export const ControlPanel: React.FC<ControlPanelProps> = ({ sessionState, isMuted, onStart, onStop, onMuteToggle }) => {
  const isSessionActive = sessionState === SessionState.ACTIVE;
  const isConnecting = sessionState === SessionState.CONNECTING;

  return (
    <div className="bg-slate-900/50 p-4 border-t border-slate-700 flex items-center justify-between gap-4">
        <div className="text-sm w-32 hidden sm:block">
            {getStatusIndicator(sessionState)}
        </div>
      <div className="flex-grow flex justify-center items-center gap-4">
        {sessionState === SessionState.IDLE ? (
          <button
            onClick={onStart}
            disabled={isConnecting}
            className="w-48 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-full flex items-center justify-center gap-2 text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? 'Starting...' : 'Start Tutoring'}
          </button>
        ) : (
          <button
            onClick={onStop}
            className="w-48 h-16 bg-gradient-to-r from-pink-500 to-red-600 text-white font-bold rounded-full flex items-center justify-center gap-2 text-lg hover:scale-105 transition-transform"
          >
            End Session
          </button>
        )}
      </div>

       <div className="w-32 flex justify-end">
            {isSessionActive && (
                <button 
                    onClick={onMuteToggle}
                    className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-500/80 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? <MicOffIcon /> : <MicIcon />}
                </button>
            )}
       </div>
    </div>
  );
};
