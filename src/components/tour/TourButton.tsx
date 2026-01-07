'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

interface TourButtonProps {
  tourType?: 'home' | 'game';
}

// Dynamically import the tour component to avoid SSR issues
const GameTour = dynamic(() => import('./GameTour'), {
  ssr: false,
});

const TourButton = ({ tourType = 'home' }: TourButtonProps) => {
  const [showTour, setShowTour] = useState(false);

  const startTour = () => {
    setShowTour(true);
  };

  const endTour = () => {
    setShowTour(false);
  };

  return (
    <>
      <button
        onClick={startTour}
        className="fixed bottom-4 right-4 z-50 glass-panel hover:bg-cyan-500/10 border-cyan-500/50 rounded-xl p-3 shadow-lg transition-all hover:scale-105 active:scale-95 group"
        title="Iniciar Tour Guiado"
      >
        <span className="text-xl group-hover:rotate-12 transition-transform inline-block">🎯</span>
      </button>

      {showTour && (
        <GameTour
          isActive={showTour}
          tourType={tourType}
          onExit={endTour}
        />
      )}
    </>
  );
};

export default TourButton;