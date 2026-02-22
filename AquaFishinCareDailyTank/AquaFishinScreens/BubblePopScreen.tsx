import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TANK_TASKS_STORAGE_KEY = 'AQUA_TANK_TASKS_V1';
const GAME_DURATION_SEC = 60;
const BUBBLE_SPAWN_INTERVAL_MS = 450;
const BUBBLE_TRAVEL_DURATION_MS = 2200;
const BUBBLE_MIN_SIZE = 48;
const BUBBLE_MAX_SIZE = 77;

const BUBBLE_IMAGE = require('../AquaAssets/images/bubble.png');

type Bubble = {
  id: number;
  x: number;
  size: number;
  animY: Animated.Value;
};

export default function BubblePopScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SEC);
  const [score, setScore] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [round, setRound] = useState(0);
  const idRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const safeHeight = SCREEN_HEIGHT - insets.top - insets.bottom;

  const saveAndExit = useCallback(async () => {
    if (score <= 0) {
      navigation.goBack();
      return;
    }
    try {
      const raw = await AsyncStorage.getItem(TANK_TASKS_STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : { points: 0, completed: {} };
      const currentPoints = data.points ?? 0;
      await AsyncStorage.setItem(
        TANK_TASKS_STORAGE_KEY,
        JSON.stringify({ ...data, points: currentPoints + score }),
      );
    } catch {}
    navigation.goBack();
  }, [score, navigation]);

  useEffect(() => {
    if (gameOver) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (spawnRef.current) clearInterval(spawnRef.current);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameOver, round]);

  const playAreaHeight = safeHeight - 60;

  useEffect(() => {
    const spawn = () => {
      if (gameOver) return;
      const size =
        BUBBLE_MIN_SIZE + Math.random() * (BUBBLE_MAX_SIZE - BUBBLE_MIN_SIZE);
      const x = Math.random() * (SCREEN_WIDTH - size);
      const id = ++idRef.current;
      const animY = new Animated.Value(0);
      const bubble: Bubble = { id, x, size, animY };
      setBubbles(prev => [...prev, bubble]);
      Animated.timing(animY, {
        toValue: -(playAreaHeight + size + 20),
        duration: BUBBLE_TRAVEL_DURATION_MS,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          setBubbles(prev => prev.filter(b => b.id !== id));
        }
      });
    };
    spawn();
    spawnRef.current = setInterval(spawn, BUBBLE_SPAWN_INTERVAL_MS);
    return () => {
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, [gameOver, playAreaHeight, round]);

  const popBubble = useCallback((id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setScore(prev => prev + 1);
  }, []);

  const playAgain = useCallback(() => {
    setGameOver(false);
    setTimeLeft(GAME_DURATION_SEC);
    setScore(0);
    setBubbles([]);
    setRound(r => r + 1);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreBoxText}>{score}</Text>
          </View>
          <View style={styles.timerBox}>
            <Text style={styles.timerBoxText}>
              {gameOver
                ? '0:00'
                : `${Math.floor(timeLeft / 60)}:${(timeLeft % 60)
                    .toString()
                    .padStart(2, '0')}`}
            </Text>
          </View>
        </View>
        <Pressable style={styles.closeBtn} onPress={saveAndExit}>
          <Image source={require('../AquaAssets/images/close.png')} />
        </Pressable>
      </View>

      <View style={[styles.playArea, { height: safeHeight - 60 }]}>
        {bubbles.map(b => (
          <BubbleView
            key={b.id}
            x={b.x}
            size={b.size}
            animY={b.animY}
            onPress={() => popBubble(b.id)}
          />
        ))}
      </View>

      <Modal visible={gameOver} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Water refreshed</Text>
            <Text style={styles.modalMessage}>
              You cleared enough bubbles to help the tank breathe
            </Text>
            <View style={styles.modalPointsBadge}>
              <Image
                source={require('../AquaAssets/images/points.png')}
                style={styles.modalPointsIcon}
                resizeMode="contain"
              />
              <Text style={styles.modalPointsText}>{score}</Text>
            </View>
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalBtnBack} onPress={saveAndExit}>
                <Text style={styles.modalBtnText}>Back</Text>
              </Pressable>
              <Pressable style={styles.modalBtnAgain} onPress={playAgain}>
                <Text style={styles.modalBtnText}>Play Again</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BubbleView({
  x,
  size,
  animY,
  onPress,
}: {
  x: number;
  size: number;
  animY: Animated.Value;
  onPress: () => void;
}) {
  return (
    <Animated.View
      style={[
        styles.bubbleWrap,
        {
          left: x,
          width: size,
          height: size,
          transform: [{ translateY: animY }],
        },
      ]}
    >
      <Pressable style={styles.bubble} onPress={onPress}>
        <Image
          source={BUBBLE_IMAGE}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#011D5A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  scoreBox: {
    backgroundColor: '#02AD58',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 108,
    alignItems: 'center',
  },
  scoreBoxText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  timerBox: {
    backgroundColor: '#45ACEC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 108,
  },
  timerBoxText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 22,
    backgroundColor: '#040523',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playArea: {
    width: SCREEN_WIDTH,
    position: 'relative',
  },
  bubbleWrap: {
    position: 'absolute',
    bottom: 0,
  },
  bubble: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.23)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#040523',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    paddingHorizontal: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 3,
  },
  modalMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: '#FF9600',
    marginBottom: 24,
  },
  modalPointsIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  modalPointsText: {
    color: '#854E00',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnBack: {
    flex: 1,
    backgroundColor: '#011D5A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnAgain: {
    flex: 1,
    backgroundColor: '#02AD58',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
