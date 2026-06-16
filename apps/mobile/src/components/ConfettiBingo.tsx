/**
 * ConfettiBingo — animation confettis + feu d'artifice au BINGO
 * Durée max : 4 secondes. S'efface automatiquement.
 */
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors } from './ui/tokens';

const { width: W, height: H } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#E53935', '#FB8C00', '#F4D03F', '#43A047',
  '#1E88E5', '#8E24AA', '#E91E63', '#00ACC1',
];

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
  shape: 'rect' | 'circle' | 'star';
}

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const distance = 100 + Math.random() * 200;
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length] ?? '#E53935';
    return {
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(1),
      color,
      size: 8 + Math.random() * 10,
      shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'rect' : 'star',
      _targetX: Math.cos(angle) * distance * (0.7 + Math.random() * 0.6),
      _targetY: Math.sin(angle) * distance * (0.7 + Math.random() * 0.6) - 60,
    } as Particle & { _targetX: number; _targetY: number };
  });
}

interface ConfettiBingoProps {
  visible: boolean;
  reward?: 'coupon' | 'xp' | 'none';
  xpAmount?: number;
  onFinished?: () => void;
}

export default function ConfettiBingo({
  visible,
  reward = 'coupon',
  xpAmount = 50,
  onFinished,
}: ConfettiBingoProps) {
  const PARTICLE_COUNT = 32;
  const particles = useRef<(Particle & { _targetX: number; _targetY: number })[]>(
    createParticles(PARTICLE_COUNT) as (Particle & { _targetX: number; _targetY: number })[]
  ).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const rewardScale    = useRef(new Animated.Value(0)).current;
  const textOpacity    = useRef(new Animated.Value(0)).current;
  const bursting = useRef(false);

  useEffect(() => {
    if (!visible || bursting.current) return;
    bursting.current = true;

    // Reset all particles
    particles.forEach(p => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.opacity.setValue(1);
      p.rotate.setValue(0);
      p.scale.setValue(0.3);
    });
    containerOpacity.setValue(1);
    rewardScale.setValue(0);
    textOpacity.setValue(0);

    // Burst particles outward
    const particleAnims = particles.map(p =>
      Animated.parallel([
        Animated.timing(p.x, { toValue: p._targetX, duration: 900, useNativeDriver: true }),
        Animated.timing(p.y, { toValue: p._targetY, duration: 900, useNativeDriver: true }),
        Animated.timing(p.scale, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(p.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.delay(700),
          Animated.timing(p.opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
        Animated.timing(p.rotate, {
          toValue: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 4),
          duration: 900, useNativeDriver: true,
        }),
      ])
    );

    // Reward badge pop-up
    const rewardAnim = Animated.sequence([
      Animated.spring(rewardScale, { toValue: 1.2, useNativeDriver: true, tension: 120, friction: 7 }),
      Animated.spring(rewardScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }),
    ]);
    const textAnim = Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true });

    // Second wave of particles (delayed)
    const wave2 = Animated.delay(400);

    Animated.parallel([
      ...particleAnims,
      rewardAnim,
      textAnim,
      wave2,
    ]).start();

    // Fade out entire overlay after 3.5s, call onFinished at 4s
    const fadeTimer = setTimeout(() => {
      Animated.timing(containerOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        bursting.current = false;
        onFinished?.();
      });
    }, 3500);

    return () => clearTimeout(fadeTimer);
  }, [visible]);

  if (!visible && !bursting.current) return null;

  const rewardLabel =
    reward === 'coupon' ? '🎟 Coupon gagné !' :
    reward === 'xp'     ? `⭐ +${xpAmount} XP !` :
    '🎉 BINGO !';

  return (
    <Animated.View style={[styles.overlay, { opacity: containerOpacity }]} pointerEvents="none">
      {/* Particles */}
      <View style={styles.particleOrigin}>
        {particles.map((p, i) => {
          const rotateStr = p.rotate.interpolate({
            inputRange: [-4, 0, 4],
            outputRange: ['-1440deg', '0deg', '1440deg'],
          });
          const shapeStyle =
            p.shape === 'circle'
              ? { borderRadius: p.size / 2 }
              : p.shape === 'rect'
              ? { borderRadius: 2 }
              : { transform: [{ rotate: '45deg' }] };

          return (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                shapeStyle,
                {
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  opacity: p.opacity,
                  transform: [
                    { translateX: p.x },
                    { translateY: p.y },
                    { scale: p.scale },
                    { rotate: rotateStr },
                  ],
                },
              ]}
            />
          );
        })}
      </View>

      {/* Reward badge */}
      <Animated.View
        style={[styles.rewardBadge, { transform: [{ scale: rewardScale }], opacity: textOpacity }]}
      >
        <Text style={styles.bingoBang}>BINGO !!!</Text>
        <Text style={styles.rewardText}>{rewardLabel}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleOrigin: {
    position: 'absolute',
    top: H / 2,
    left: W / 2,
    width: 0,
    height: 0,
  },
  particle: {
    position: 'absolute',
  },
  rewardBadge: {
    backgroundColor: 'rgba(20, 10, 0, 0.88)',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: Colors.gold,
    paddingHorizontal: 40,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  bingoBang: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.orange,
    letterSpacing: 4,
    marginBottom: 8,
    textShadowColor: Colors.gold,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  rewardText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.parchment,
    textAlign: 'center',
  },
});
