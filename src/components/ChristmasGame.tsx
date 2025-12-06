import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import supabase from '@/supabase';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Trophy, Trash2 } from 'lucide-react';

interface ChristmasGameProps {
  isOpen: boolean;
  onClose: () => void;
}

const GRAVITY = 0.6;
const JUMP_STRENGTH = -12;
const GROUND_Y = 320;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const INITIAL_SPEED = 4; // Vitesse réduite (était 6)
const SPEED_INCREASE = 0.0005; // Accélération plus douce (était 0.002)

interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'tree' | 'gift' | 'snowman';
  emoji: string;
}

interface Particle {
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
}

interface LeaderboardEntry {
  id: string;
  score: number;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
}

const ChristmasGame: React.FC<ChristmasGameProps> = ({ isOpen, onClose }) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const { currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Refs pour l'état du jeu (pour la boucle d'animation performante)
  const gameState = useRef({
    playerY: GROUND_Y,
    playerVelocity: 0,
    isJumping: false,
    obstacles: [] as Entity[],
    gameSpeed: INITIAL_SPEED,
    score: 0,
    frameCount: 0,
    snowParticles: [] as Particle[],
    runAnimation: 0, // Pour l'animation de course
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  // Initialiser la neige (Moins de particules pour la performance)
  const initSnow = useCallback(() => {
    const particles: Particle[] = [];
    // Réduit de 100 à 60 particules pour alléger le rendu
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        speed: 1 + Math.random() * 2, // Vitesse légèrement réduite
        size: 1 + Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.5,
      });
    }
    gameState.current.snowParticles = particles;
  }, []);

  const resetGame = useCallback(() => {
    gameState.current = {
      playerY: GROUND_Y,
      playerVelocity: 0,
      isJumping: false,
      obstacles: [],
      gameSpeed: INITIAL_SPEED,
      score: 0,
      frameCount: 0,
      snowParticles: gameState.current.snowParticles, // Garder la neige
      runAnimation: 0,
    };
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setIsStarted(false);
    initSnow();
  }, [initSnow]);

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', currentUser.id)
          .single();
        
        setIsAdmin(profile?.is_admin || false);
      }
    };
    checkAdminStatus();
  }, [currentUser]);

  // Réinitialiser le leaderboard (Admin seulement)
  const resetLeaderboard = async () => {
    if (!isAdmin || !window.confirm('Êtes-vous sûr de vouloir supprimer TOUS les scores ? Cette action est irréversible.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('game_scores')
        .delete()
        .eq('game_type', 'christmas_runner');

      if (error) throw error;
      
      fetchLeaderboard();
    } catch (error) {
      console.error('Erreur reset leaderboard:', error);
    }
  };

  // Charger le leaderboard (Méthode robuste en 2 étapes EXCLUSIVE)
  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      // 1. Récupérer les scores bruts sans jointure
      const { data: scores, error: scoresError } = await supabase
        .from('game_scores')
        .select('id, score, created_at, user_id')
        .eq('game_type', 'christmas_runner')
        .order('score', { ascending: false })
        .limit(10);

      if (scoresError) throw scoresError;
      
      if (!scores || scores.length === 0) {
        setLeaderboard([]);
        return;
      }

      // 2. Récupérer les profils associés manuellement
      const userIds = [...new Set(scores.map(s => s.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // 3. Fusionner les données côté client
      const leaderboardData = scores.map(scoreEntry => {
        const profile = profiles?.find(p => p.id === scoreEntry.user_id);
        return {
          id: scoreEntry.id,
          score: scoreEntry.score,
          created_at: scoreEntry.created_at,
          profiles: {
            display_name: profile?.display_name || 'Inconnu',
            avatar_url: profile?.avatar_url || ''
          }
        };
      });
      
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Erreur chargement leaderboard:', error);
      // Fallback vide en cas d'erreur critique
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Sauvegarder le score (Uniquement le meilleur score)
  const saveScore = async (finalScore: number) => {
    if (!currentUser) {
      console.log('Score non sauvegardé : utilisateur non connecté');
      return;
    }

    console.log('Tentative de sauvegarde du score:', finalScore);

    try {
      // 1. Vérifier s'il existe déjà un score pour cet utilisateur
      const { data: existingScores, error: checkError } = await supabase
        .from('game_scores')
        .select('id, score')
        .eq('user_id', currentUser.id)
        .eq('game_type', 'christmas_runner')
        .limit(1);

      if (checkError) {
        console.error('Erreur vérification score:', checkError);
        return;
      }

      const existingScore = existingScores && existingScores.length > 0 ? existingScores[0] : null;

      if (existingScore) {
        console.log('Score existant trouvé:', existingScore.score);
        // 2. Si le nouveau score est meilleur, mettre à jour
        if (finalScore > existingScore.score) {
          console.log('Nouveau record ! Mise à jour du score...');
          const { data: updatedData, error: updateError } = await supabase
            .from('game_scores')
            .update({ score: finalScore, created_at: new Date().toISOString() })
            .eq('id', existingScore.id)
            .select();

          if (updateError) {
            console.error('Erreur lors de la mise à jour du score:', updateError);
            throw updateError;
          }
          
          if (!updatedData || updatedData.length === 0) {
             console.error('ERREUR CRITIQUE: La mise à jour a réussi mais aucune ligne n\'a été modifiée. Vérifiez les politiques RLS (Row Level Security) !');
             alert("Erreur de sauvegarde : Impossible de mettre à jour votre score. Contactez l'administrateur.");
          } else {
             console.log('Score mis à jour avec succès !', updatedData);
          }
        } else {
          console.log('Score inférieur au record actuel, pas de mise à jour.');
        }
      } else {
        console.log('Premier score pour ce jeu, insertion...');
        // 3. Sinon, insérer le nouveau score
        const { error: insertError } = await supabase
          .from('game_scores')
          .insert({
            user_id: currentUser.id,
            score: finalScore,
            game_type: 'christmas_runner'
          });

        if (insertError) {
          console.error('Erreur lors de l\'insertion du score:', insertError);
          throw insertError;
        }
        console.log('Nouveau score inséré avec succès !');
      }

      // Rafraîchir le leaderboard immédiatement après
      await fetchLeaderboard();
    } catch (error) {
      console.error('Erreur générale sauvegarde score:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  // Gestion des touches
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (!isStarted) {
        setIsStarted(true);
        return;
      }
      if (gameOver) {
        resetGame();
        setIsStarted(true);
        return;
      }
      if (!gameState.current.isJumping) {
        gameState.current.playerVelocity = JUMP_STRENGTH;
        gameState.current.isJumping = true;
      }
    }
    
    if (e.code === 'KeyP') {
      setIsPaused(prev => !prev);
    }
  }, [isStarted, gameOver, resetGame]);

  // Boucle de jeu principale
  const gameLoop = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // 1. Mise à jour de l'état (si le jeu tourne)
    if (isStarted && !isPaused && !gameOver) {
      const state = gameState.current;
      state.frameCount++;
      state.score += 0.1; // Score basé sur la distance
      
      // OPTIMISATION: Ne mettre à jour l'état React que tous les 10 points ou frames pour éviter le lag
      if (state.frameCount % 10 === 0) {
        setScore(Math.floor(state.score));
      }
      
      // Gravité
      state.playerY += state.playerVelocity;
      state.playerVelocity += GRAVITY;

      // Sol
      if (state.playerY > GROUND_Y) {
        state.playerY = GROUND_Y;
        state.playerVelocity = 0;
        state.isJumping = false;
      }

      // Vitesse du jeu
      state.gameSpeed += SPEED_INCREASE;

      // Animation de course (oscillation légère)
      if (!state.isJumping) {
        state.runAnimation = Math.sin(state.frameCount * 0.5) * 3;
      } else {
        state.runAnimation = 0;
      }

      // Génération d'obstacles
      // On augmente l'intervalle entre les obstacles (diviseur plus petit = plus d'espace)
      if (state.frameCount % Math.floor(1000 / (state.gameSpeed * 3)) === 0) {
        // 1 chance sur 4 d'avoir un cadeau
        const isGift = Math.random() < 0.25;
        // Si ce n'est pas un cadeau, chance d'avoir un bonhomme de neige ou un sapin
        const type = isGift ? 'gift' : (Math.random() < 0.5 ? 'tree' : 'snowman');
        
        state.obstacles.push({
          x: CANVAS_WIDTH,
          y: isGift ? GROUND_Y - 40 : GROUND_Y, // Cadeaux volent parfois un peu
          width: 40,
          height: 40,
          type: type,
          emoji: type === 'gift' ? '🎁' : (type === 'tree' ? '🎄' : '⛄')
        });
      }

      // Déplacement des obstacles
      state.obstacles.forEach(obs => {
        obs.x -= state.gameSpeed;
      });

      // Nettoyage des obstacles hors écran
      state.obstacles = state.obstacles.filter(obs => obs.x > -100);

      // Collisions
      const playerHitbox = {
        x: 150, // Position X fixe du joueur
        y: state.playerY + 10, // Ajustement hitbox
        width: 30,
        height: 40
      };

      // Vérifier collisions (boucle inverse pour pouvoir supprimer des éléments)
      for (let i = state.obstacles.length - 1; i >= 0; i--) {
        const obs = state.obstacles[i];
        const obsHitbox = {
          x: obs.x + 10,
          y: obs.y + 10,
          width: obs.width - 20,
          height: obs.height - 10
        };

        if (
          playerHitbox.x < obsHitbox.x + obsHitbox.width &&
          playerHitbox.x + playerHitbox.width > obsHitbox.x &&
          playerHitbox.y < obsHitbox.y + obsHitbox.height &&
          playerHitbox.y + playerHitbox.height > obsHitbox.y
        ) {
          if (obs.type === 'gift') {
            // Cadeau collecté !
            state.score += 10;
            state.obstacles.splice(i, 1); // Retirer le cadeau
            // Effet visuel de collecte ? (TODO)
          } else {
            // Obstacle touché !
            setGameOver(true);
            saveScore(Math.floor(state.score)); // Sauvegarder le score
          }
        }
      }
    }

    // 2. Dessin
    const state = gameState.current;

    // Ciel (Dégradé)
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0f172a'); // Bleu nuit foncé
    gradient.addColorStop(1, '#1e3a8a'); // Bleu plus clair
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Lune
    ctx.fillStyle = '#FEFCD7';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#FEFCD7';
    ctx.beginPath();
    ctx.arc(700, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Neige (arrière-plan)
    ctx.fillStyle = 'white';
    state.snowParticles.forEach(p => {
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Animation neige (Optimisée : moins de calculs trigonométriques)
      if (!isPaused) {
        p.y += p.speed;
        // Remplacer Math.sin par une oscillation simple basée sur un compteur global ou une approximation
        // On réduit la fréquence des calculs de sin
        p.x += Math.sin(p.y * 0.01) * 0.5; 
        if (p.y > CANVAS_HEIGHT) p.y = -10;
        if (p.x > CANVAS_WIDTH) p.x = 0;
        if (p.x < 0) p.x = CANVAS_WIDTH;
      }
    });
    ctx.globalAlpha = 1;

    // Sol (Neige)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, GROUND_Y + 40, CANVAS_WIDTH, CANVAS_HEIGHT - (GROUND_Y + 40));
    // Bord du sol neigeux
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 40);
    // Petit effet de vague pour la neige au sol
    for (let i = 0; i <= CANVAS_WIDTH; i += 50) {
      ctx.quadraticCurveTo(i + 25, GROUND_Y + 35, i + 50, GROUND_Y + 40);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.fill();

    // Le Grinch (Poursuivant)
    if (isStarted) {
      ctx.font = '50px Arial';
      // Le Grinch court derrière, il oscille aussi
      const grinchY = GROUND_Y + Math.sin(state.frameCount * 0.3) * 5;
      ctx.fillText('👹', 50, grinchY + 40);
      
      // Bulle de dialogue du Grinch (parfois)
      if (state.frameCount % 200 < 100) {
        ctx.font = '14px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('Je vais t\'avoir !', 20, grinchY);
      }
    }

    // Le Joueur (Père Noël)
    ctx.font = '50px Arial';
    // Sauvegarder le contexte pour la rotation/transformation
    ctx.save();
    ctx.translate(150 + 25, state.playerY + 25); // Centre du joueur
    // Inclinaison quand il saute
    if (state.isJumping) {
      ctx.rotate(-0.2);
    } else {
      // Petit balancement quand il court
      ctx.rotate(state.runAnimation * 0.05);
    }
    ctx.fillText('🎅', -25, 15); // Dessiner centré
    ctx.restore();

    // Obstacles
    state.obstacles.forEach(obs => {
      ctx.font = '40px Arial';
      ctx.fillText(obs.emoji, obs.x, obs.y + 40);
    });

    // Score
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${Math.floor(state.score)}`, CANVAS_WIDTH - 20, 40);
    ctx.textAlign = 'left'; // Reset

    // UI Overlays
    if (!isStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#FFF';
      ctx.textAlign = 'center';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('🎄 Sauvez Noël ! 🎄', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      ctx.font = '20px sans-serif';
      ctx.fillText('Appuyez sur ESPACE ou CLIQUEZ pour sauter', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText('Évitez 🌲 et ⛄, attrapez les 🎁', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      ctx.font = 'italic 16px sans-serif';
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText('Attention au Grinch 👹 derrière vous !', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
      
    } else if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ff4444';
      ctx.textAlign = 'center';
      ctx.font = 'bold 48px sans-serif';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillStyle = '#FFF';
      ctx.font = '24px sans-serif';
      ctx.fillText(`Score Final: ${Math.floor(state.score)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    } else if (isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#FFF';
      ctx.textAlign = 'center';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('PAUSE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [isStarted, isPaused, gameOver]);

  // Effet pour initialiser le jeu à l'ouverture UNIQUEMENT
  useEffect(() => {
    if (isOpen) {
      resetGame();
    }
  }, [isOpen, resetGame]);

  // Effet pour la boucle d'animation
  useEffect(() => {
    if (isOpen) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isOpen, gameLoop]);

  // Gestion des clics (souris/tactile)
  const handleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isStarted) {
      setIsStarted(true);
      return;
    }
    if (gameOver) {
      resetGame();
      setIsStarted(true);
      return;
    }
    if (!gameState.current.isJumping) {
      gameState.current.playerVelocity = JUMP_STRENGTH;
      gameState.current.isJumping = true;
    }
  }, [isStarted, gameOver, resetGame]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen, handleKeyPress]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[850px] p-0 bg-transparent border-none shadow-none focus:outline-none flex flex-col gap-4">
        <DialogHeader className="sr-only">
          <DialogTitle>Jeu de Noël MHPick</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-4">
          {/* Zone de jeu */}
          <div 
            className="relative rounded-xl overflow-hidden border-4 border-white/50 shadow-2xl select-none w-full cursor-pointer touch-none"
            onClick={handleClick}
            onTouchStart={handleClick}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="bg-[#0f172a] w-full h-auto block"
            />
            
            {/* Overlay Boutons Interactifs */}
            {!isStarted && (
              <div className="absolute inset-0 flex items-center justify-center pt-32 pointer-events-none">
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-12 text-xl rounded-full shadow-lg animate-pulse pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsStarted(true);
                  }}
                >
                  JOUER 🎅
                </Button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 flex items-center justify-center pt-20 pointer-events-none">
                <Button 
                  className="bg-white text-red-600 hover:bg-gray-100 font-bold py-4 px-8 text-lg rounded-full shadow-lg pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetGame();
                    setIsStarted(true);
                  }}
                >
                  REJOUER 🔄
                </Button>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="w-full md:w-72 bg-black/80 backdrop-blur-md rounded-xl border-2 border-white/20 p-4 text-white flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/20">
              <div className="flex items-center gap-2">
                <Trophy className="text-yellow-400" />
                <h3 className="font-bold text-lg">Top Scores</h3>
              </div>
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-white/10"
                  onClick={resetLeaderboard}
                  title="Réinitialiser le leaderboard"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <ScrollArea className="flex-1">
              {loadingLeaderboard ? (
                <div className="text-center text-sm text-gray-400 py-4">Chargement...</div>
              ) : leaderboard.length > 0 ? (
                <div className="space-y-3 pr-4">
                  {leaderboard.map((entry, index) => (
                    <div key={entry.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`
                          w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                          ${index === 0 ? 'bg-yellow-400 text-black' : 
                            index === 1 ? 'bg-gray-300 text-black' : 
                            index === 2 ? 'bg-amber-600 text-black' : 'bg-white/10'}
                        `}>
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8 border border-white/20">
                          <AvatarImage src={entry.profiles?.avatar_url} />
                          <AvatarFallback className="text-black text-xs">
                            {entry.profiles?.display_name?.substring(0, 2).toUpperCase() || '??'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate font-medium">
                          {entry.profiles?.display_name || 'Anonyme'}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-green-400">
                        {entry.score}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-gray-400 py-4">
                  Soyez le premier à marquer !
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="text-center text-white bg-black/50 p-2 rounded-lg backdrop-blur-sm pointer-events-none">
          <p className="font-medium">🎅 Père Noël vs Le Grinch 👹</p>
          <p className="text-sm opacity-80">Sauter : Espace/Haut ou Clic | Pause : P</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChristmasGame;
