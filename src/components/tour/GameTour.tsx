'use client';

import { useEffect, useRef, useCallback } from 'react';
import 'driver.js/dist/driver.css';

interface GameTourProps {
  isActive: boolean;
  tourType?: 'home' | 'game';
  onComplete?: () => void;
  onExit?: () => void;
}

const GameTour = ({ isActive, tourType = 'home', onComplete, onExit }: GameTourProps) => {
  const driverRef = useRef<any>(null);

  const defineSteps = useCallback(() => {
    if (!driverRef.current) return;

    if (tourType === 'home') {
      // Home page tour steps
      driverRef.current.setSteps([
        {
          element: '#tour-home-title',
          popover: {
            title: 'Bienvenido a la Misión Espacial',
            description: 'Este es el panel principal donde puedes crear una nueva sala o unirte a una existente.',
            side: 'bottom',
          },
        },
        {
          element: '#tour-create-room',
          popover: {
            title: 'Crear Nuevo Sector',
            description: 'Haz clic aquí para crear una nueva sala de juego. Se generará un código único que puedes compartir con otros jugadores.',
            side: 'bottom',
          },
        },
        {
          element: '#tour-room-input',
          popover: {
            title: 'Unirse a un Sector',
            description: 'Ingresa el código de la sala a la que deseas unirte. El código tiene 6 caracteres y es sensible a mayúsculas.',
            side: 'bottom',
          },
        },
        {
          element: '#tour-join-button',
          popover: {
            title: 'Unirse al Sector',
            description: 'Después de ingresar el código, haz clic aquí para unirte a la sala de juego.',
            side: 'bottom',
          },
        },
        {
          element: '#tour-game-instructions',
          popover: {
            title: 'Cómo Jugar',
            description: 'Aquí encontrarás las instrucciones básicas del juego. El objetivo es completar los 4 Sistemas Críticos de tu nave antes que tus oponentes.',
            side: 'top',
          },
        },
      ]);
    } else if (tourType === 'game') {
      // Game room tour steps
      driverRef.current.setSteps([
        {
          element: '#tour-room-header',
          popover: {
            title: 'Encabezado de la Sala',
            description: 'Aquí puedes ver el título del juego y el código de la sala a la que te has unido.',
            side: 'bottom',
          },
        },
        {
          element: '#tour-player-boards',
          popover: {
            title: 'Tableros de Jugadores',
            description: 'Aquí se muestran los sistemas de todos los jugadores. Cada jugador tiene 5 sistemas: Motor, Oxígeno, Navegación, Escudos y Sistema Operativo.',
            side: 'top',
          },
        },
        {
          element: '#tour-system-slots',
          popover: {
            title: 'Sistemas de la Nave',
            description: 'Cada jugador tiene 5 sistemas representados por colores. El objetivo es completar todos tus sistemas antes que los demás.',
            side: 'bottom',
          },
        },
        {
          element: '#tour-player-hand',
          popover: {
            title: 'Tu Mano de Cartas',
            description: 'Aquí están las cartas que puedes jugar. Hay 4 tipos: Sistemas (instalan componentes), Sabotajes (dañan sistemas enemigos), Reparaciones (protegen o reparan tus sistemas) y Acciones (efectos especiales).',
            side: 'top',
          },
        },
        {
          element: '#tour-end-turn',
          popover: {
            title: 'Terminar Turno',
            description: 'Después de realizar al menos una acción, haz clic aquí para terminar tu turno y pasar al siguiente jugador.',
            side: 'top',
          },
        },
        {
          element: '#tour-card-actions',
          popover: {
            title: 'Acciones con Cartas',
            description: 'Puedes hacer clic en una carta para seleccionarla, luego hacer clic en un sistema para jugarla allí. También puedes arrastrar y soltar las cartas.',
            side: 'top',
          },
        },
      ]);
    }
  }, [tourType]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Dynamically import Driver.js
      import('driver.js').then((DriverModule) => {
        const driver = DriverModule.driver;
        driverRef.current = driver({
          animate: true,
          overlayOpacity: 0.75,
          stagePadding: 10,
          allowClose: true,
          overlayColor: '#0f172a',
          stageRadius: 5,
          showButtons: ['next', 'previous', 'close'],
          allowKeyboardControl: true,
          onHighlightStarted: (element) => {
            // Scroll element into view if needed
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          },
          onDestroyStarted: () => {
            if (onExit) onExit();
          },
        });

        // Start the tour if it's active
        if (isActive) {
          defineSteps();
          driverRef.current.drive();
        }
      });

      return () => {
        if (driverRef.current) {
          driverRef.current.destroy();
        }
      };
    }
  }, [onExit, defineSteps, isActive]);

  useEffect(() => {
    if (isActive && driverRef.current) {
      defineSteps();
      driverRef.current.drive();
    } else if (!isActive && driverRef.current) {
      driverRef.current.destroy();
    }
  }, [isActive, tourType, defineSteps]);

  return null;
};

export default GameTour;