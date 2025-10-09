import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import supabase from '@/supabase';

interface HalloweenContextType {
  isHalloweenMode: boolean;
  toggleHalloweenMode: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  playStormAudio: () => void;
  stopStormAudio: () => void;
  randomAudioRef: React.RefObject<HTMLAudioElement>;
  playRandomSound: () => void;
  globalHalloweenMode: boolean;
  userHalloweenDisabled: boolean;
  halloweenRandomAudio: boolean;
  halloweenStormAudio: boolean;
  halloweenStormVisual: boolean;
  halloweenRain: boolean;
  halloweenSurprise: boolean;
  halloweenParticles: boolean;
  halloweenFlyingBats: boolean;
}

const HalloweenContext = createContext<HalloweenContextType | undefined>(undefined);

export function HalloweenProvider({ children }: { children: React.ReactNode }) {
  const [isHalloweenMode, setIsHalloweenMode] = useState<boolean>(false);
  const [globalHalloweenMode, setGlobalHalloweenMode] = useState<boolean>(false);
  const [userHalloweenDisabled, setUserHalloweenDisabled] = useState<boolean>(false);
  const [halloweenRandomAudio, setHalloweenRandomAudio] = useState<boolean>(true);
  const [halloweenStormAudio, setHalloweenStormAudio] = useState<boolean>(true);
  const [halloweenStormVisual, setHalloweenStormVisual] = useState<boolean>(true);
  const [halloweenRain, setHalloweenRain] = useState<boolean>(true);
  const [halloweenSurprise, setHalloweenSurprise] = useState<boolean>(true);
  const [halloweenParticles, setHalloweenParticles] = useState<boolean>(false);
  const [halloweenFlyingBats, setHalloweenFlyingBats] = useState<boolean>(true);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const randomAudioRef = useRef<HTMLAudioElement>(null);
  
  // Liste des sons aléatoires disponibles
  const randomSounds = ['/chouette.ogg', '/sonhibou.ogg', '/sonrire.ogg'];
  
  // État pour suivre le dernier son joué (pour éviter les répétitions consécutives)
  const [lastPlayedSound, setLastPlayedSound] = useState<string | null>(null);

  // Charger tous les paramètres Halloween au démarrage
  useEffect(() => {
    // Charger la préférence utilisateur depuis localStorage
    const savedUserPreference = localStorage.getItem('userHalloweenDisabled');
    if (savedUserPreference !== null) {
      setUserHalloweenDisabled(savedUserPreference === 'true');
    }

    const fetchHalloweenSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('key, value')
          .in('key', ['global_halloween_mode', 'halloween_random_audio', 'halloween_storm_audio', 'halloween_storm_visual', 'halloween_rain', 'halloween_surprise', 'halloween_particles', 'halloween_flying_bats']);
        
        if (error) {
          console.error('Erreur lors du chargement des paramètres Halloween:', error);
          return;
        }
        
        // Traiter les résultats
        data.forEach(setting => {
          const value = setting.value === 'true';
          switch (setting.key) {
            case 'global_halloween_mode':
              setGlobalHalloweenMode(value);
              break;
            case 'halloween_random_audio':
              setHalloweenRandomAudio(value);
              break;
            case 'halloween_storm_audio':
              setHalloweenStormAudio(value);
              break;
            case 'halloween_storm_visual':
              setHalloweenStormVisual(value);
              break;
            case 'halloween_rain':
              setHalloweenRain(value);
              break;
            case 'halloween_surprise':
              setHalloweenSurprise(value);
              break;
            case 'halloween_particles':
              setHalloweenParticles(value);
              break;
            case 'halloween_flying_bats':
              setHalloweenFlyingBats(value);
              break;
          }
        });
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres Halloween:', error);
      }
    };

    fetchHalloweenSettings();
  }, []);

  // Calculer le mode Halloween final (global ET non désactivé par l'utilisateur)
  useEffect(() => {
    const finalHalloweenMode = globalHalloweenMode && !userHalloweenDisabled;
    setIsHalloweenMode(finalHalloweenMode);
  }, [globalHalloweenMode, userHalloweenDisabled]);

  // Écouter les changements de tous les paramètres Halloween
  useEffect(() => {
    const channel = supabase
      .channel('site_settings_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'site_settings',
        filter: 'key=in.global_halloween_mode,halloween_random_audio,halloween_storm_audio,halloween_storm_visual,halloween_rain,halloween_surprise,halloween_particles,halloween_flying_bats'
      }, (payload) => {
        const newValue = payload.new?.value === 'true' || false;
        switch (payload.new?.key) {
          case 'global_halloween_mode':
            setGlobalHalloweenMode(newValue);
            break;
          case 'halloween_random_audio':
            setHalloweenRandomAudio(newValue);
            break;
          case 'halloween_storm_audio':
            setHalloweenStormAudio(newValue);
            break;
          case 'halloween_storm_visual':
            setHalloweenStormVisual(newValue);
            break;
          case 'halloween_rain':
            setHalloweenRain(newValue);
            break;
          case 'halloween_surprise':
            setHalloweenSurprise(newValue);
            break;
          case 'halloween_particles':
            setHalloweenParticles(newValue);
            break;
          case 'halloween_flying_bats':
            setHalloweenFlyingBats(newValue);
            break;
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Gérer les classes CSS et les audios selon le mode Halloween final
  useEffect(() => {
    const root = window.document.documentElement;
    if (isHalloweenMode) {
      root.classList.add('halloween-mode');
      
      // Réinitialiser le dernier son joué quand le mode Halloween est activé
      setLastPlayedSound(null);
      
      // Démarrer le système de sons aléatoires seulement si activé
      if (halloweenRandomAudio) {
        const playRandomSoundInterval = () => {
          const randomDelay = Math.random() * 60000 + 60000; // Entre 1 et 2 minutes
          setTimeout(() => {
            if (isHalloweenMode && halloweenRandomAudio) {
              playRandomSound();
              playRandomSoundInterval(); // Toujours programmer le prochain son
            }
          }, randomDelay);
        };
        
        // Démarrer le premier son après un délai initial
        setTimeout(() => {
          if (isHalloweenMode && halloweenRandomAudio) {
            playRandomSoundInterval();
          }
        }, Math.random() * 30000 + 30000); // Premier son entre 30 secondes et 1 minute
      }
      
    } else {
      root.classList.remove('halloween-mode');
      // Arrêter tous les audios si le mode Halloween est désactivé
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (randomAudioRef.current) {
        randomAudioRef.current.pause();
        randomAudioRef.current.currentTime = 0;
      }
    }
  }, [isHalloweenMode, halloweenRandomAudio]);

  const toggleHalloweenMode = () => {
    // Permettre à l'utilisateur de désactiver le thème Halloween même si activé globalement
    if (globalHalloweenMode) {
      const newDisabledState = !userHalloweenDisabled;
      setUserHalloweenDisabled(newDisabledState);
      localStorage.setItem('userHalloweenDisabled', newDisabledState.toString());
    }
  };

  const playStormAudio = () => {
    if (audioRef.current && isHalloweenMode && halloweenStormAudio) {
      audioRef.current.volume = 0.4; // Volume modéré pour l'orage
      audioRef.current.currentTime = 0; // Recommencer depuis le début
      audioRef.current.play().catch(console.error);
    }
  };

  const stopStormAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const playRandomSound = () => {
    if (randomAudioRef.current && isHalloweenMode && halloweenRandomAudio) {
      // Filtrer les sons pour éviter de rejouer le même son que le précédent
      const availableSounds = randomSounds.filter(sound => sound !== lastPlayedSound);
      
      // Si tous les sons sont identiques au dernier joué, utiliser tous les sons
      const soundsToChooseFrom = availableSounds.length > 0 ? availableSounds : randomSounds;
      
      // Choisir un son aléatoire
      const randomSound = soundsToChooseFrom[Math.floor(Math.random() * soundsToChooseFrom.length)];
      
      // Marquer ce son comme le dernier joué
      setLastPlayedSound(randomSound);
      
      // Jouer le son
      randomAudioRef.current.src = randomSound;
      randomAudioRef.current.volume = 0.3; // Volume modéré
      randomAudioRef.current.currentTime = 0;
      randomAudioRef.current.play().catch(console.error);
    }
  };

  return (
    <HalloweenContext.Provider value={{
      isHalloweenMode,
      toggleHalloweenMode,
      audioRef,
      playStormAudio,
      stopStormAudio,
      randomAudioRef,
      playRandomSound,
      globalHalloweenMode,
      userHalloweenDisabled,
      halloweenRandomAudio,
      halloweenStormAudio,
      halloweenStormVisual,
      halloweenRain,
      halloweenSurprise,
      halloweenParticles,
      halloweenFlyingBats
    }}>
      {children}
      {/* Audio caché pour l'ambiance d'orage */}
      <audio 
        ref={audioRef}
        preload="auto"
        style={{ display: 'none' }}
      >
        <source src="/orage.ogg" type="audio/ogg" />
        Votre navigateur ne supporte pas l'élément audio.
      </audio>
      
      {/* Audio caché pour les sons aléatoires */}
      <audio 
        ref={randomAudioRef}
        preload="auto"
        style={{ display: 'none' }}
      >
        Votre navigateur ne supporte pas l'élément audio.
      </audio>
    </HalloweenContext.Provider>
  );
}

export function useHalloween() {
  const context = useContext(HalloweenContext);
  if (context === undefined) {
    throw new Error('useHalloween must be used within a HalloweenProvider');
  }
  return context;
}
