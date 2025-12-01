import React from 'react';

interface VoiceIndicatorProps {
  active: boolean;
  onClick: () => void;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({ active, onClick, status }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-24 right-6 md:right-28 md:bottom-8 z-[1000] flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl transition-all duration-500 backdrop-blur-sm border-2 border-white/20 ${
        active 
          ? 'bg-gradient-to-r from-[#CE9FFC] to-[#7367F0] scale-110 ring-8 ring-indigo-400/20' 
          : 'bg-gradient-to-r from-[#0F3443] to-[#34E89E] hover:scale-105 hover:shadow-emerald-500/30 ring-4 ring-emerald-400/10'
      } ${status === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' : ''}`}
    >
      {status === 'connecting' ? (
        <i className="fas fa-circle-notch fa-spin text-white text-xl"></i>
      ) : active ? (
        <div className="flex items-center justify-center space-x-1 h-8">
           {/* Visualizer bars */}
           <div className="w-1 bg-white/90 wave-animation rounded-full" style={{ animationDelay: '0s', height: '12px' }}></div>
           <div className="w-1 bg-white/90 wave-animation rounded-full" style={{ animationDelay: '0.2s', height: '24px' }}></div>
           <div className="w-1 bg-white/90 wave-animation rounded-full" style={{ animationDelay: '0.4s', height: '16px' }}></div>
           <div className="w-1 bg-white/90 wave-animation rounded-full" style={{ animationDelay: '0.1s', height: '20px' }}></div>
           <div className="w-1 bg-white/90 wave-animation rounded-full" style={{ animationDelay: '0.3s', height: '10px' }}></div>
        </div>
      ) : (
        <i className="fas fa-microphone text-white text-xl md:text-2xl drop-shadow-md"></i>
      )}
      
      {/* Tooltip for disconnected state */}
      {!active && status !== 'connecting' && (
        <span className="absolute -top-1 right-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      )}
    </button>
  );
};