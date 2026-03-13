// BubblePopScreen

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';

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
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: careTankScreenWidth, height: careTankScreenHeight } =
  Dimensions.get('window');
const careTankTasksStorageKey = 'AQUA_TANK_TASKS_V1';
const careTankGameDurationSec = 60;
const careTankBubbleSpawnIntervalMs = 450;
const careTankBubbleTravelDurationMs = 2200;
const careTankBubbleMinSize = 48;
const careTankBubbleMaxSize = 77;

const careTankBubbleImage = require('../AquaAssets/images/bubble.png');

type Bubble = {
  id: number;
  x: number;
  size: number;
  animY: Animated.Value;
};

export default function BubblePopScreen() {
  const careTankInsets = useSafeAreaInsets();
  const careTankNavigation = useNavigation();
  const [careTankTimeLeft, setCareTankTimeLeft] = useState(
    careTankGameDurationSec,
  );
  const [careTankScore, setCareTankScore] = useState(0);
  const [careTankBubbles, setCareTankBubbles] = useState<Bubble[]>([]);
  const [careTankGameOver, setCareTankGameOver] = useState(false);
  const [careTankRound, setCareTankRound] = useState(0);
  const careTankIdRef = useRef(0);
  const careTankTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const careTankSpawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const careTankSafeHeight =
    careTankScreenHeight - careTankInsets.top - careTankInsets.bottom;

  useFocusEffect(
    useCallback(() => {
      Orientation.lockToPortrait();
      return () => {
        Orientation.unlockAllOrientations();
      };
    }, []),
  );

  const careTankSaveAndExit = async () => {
    if (careTankScore <= 0) {
      careTankNavigation.goBack();
      return;
    }
    try {
      const careTankRaw = await AsyncStorage.getItem(careTankTasksStorageKey);
      const careTankData = careTankRaw
        ? JSON.parse(careTankRaw)
        : { points: 50, completed: {} };
      const careTankCurrentPoints = careTankData.points ?? 50;
      await AsyncStorage.setItem(
        careTankTasksStorageKey,
        JSON.stringify({
          ...careTankData,
          points: careTankCurrentPoints + careTankScore,
        }),
      );
    } catch {}
    careTankNavigation.goBack();
  };

  useEffect(() => {
    if (careTankGameOver) return;
    careTankTimerRef.current = setInterval(() => {
      setCareTankTimeLeft(prev => {
        if (prev <= 1) {
          if (careTankTimerRef.current) clearInterval(careTankTimerRef.current);
          if (careTankSpawnRef.current) clearInterval(careTankSpawnRef.current);
          setCareTankGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (careTankTimerRef.current) clearInterval(careTankTimerRef.current);
    };
  }, [careTankGameOver, careTankRound]);

  const careTankPlayAreaHeight = careTankSafeHeight - 60;

  useEffect(() => {
    const careTankSpawn = () => {
      if (careTankGameOver) return;
      const careTankSize =
        careTankBubbleMinSize +
        Math.random() * (careTankBubbleMaxSize - careTankBubbleMinSize);
      const careTankX = Math.random() * (careTankScreenWidth - careTankSize);
      const careTankId = ++careTankIdRef.current;
      const careTankAnimY = new Animated.Value(0);
      const careTankBubble: Bubble = {
        id: careTankId,
        x: careTankX,
        size: careTankSize,
        animY: careTankAnimY,
      };
      setCareTankBubbles(prev => [...prev, careTankBubble]);
      Animated.timing(careTankAnimY, {
        toValue: -(careTankPlayAreaHeight + careTankSize + 20),
        duration: careTankBubbleTravelDurationMs,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          setCareTankBubbles(prev => prev.filter(b => b.id !== careTankId));
        }
      });
    };
    careTankSpawn();
    careTankSpawnRef.current = setInterval(
      careTankSpawn,
      careTankBubbleSpawnIntervalMs,
    );
    return () => {
      if (careTankSpawnRef.current) clearInterval(careTankSpawnRef.current);
    };
  }, [careTankGameOver, careTankPlayAreaHeight, careTankRound]);

  const careTankPopBubble = (id: number) => {
    setCareTankBubbles(prev => prev.filter(b => b.id !== id));
    setCareTankScore(prev => prev + 1);
  };

  const careTankPlayAgain = () => {
    setCareTankGameOver(false);
    setCareTankTimeLeft(careTankGameDurationSec);
    setCareTankScore(0);
    setCareTankBubbles([]);
    setCareTankRound(r => r + 1);
  };

  return (
    <View
      style={[styles.careTankContainer, { paddingTop: careTankInsets.top }]}
    >
      <View style={styles.careTankHeader}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={styles.careTankScoreBox}>
            <Text style={styles.careTankScoreBoxText}>{careTankScore}</Text>
          </View>
          <View style={styles.careTankTimerBox}>
            <Text style={styles.careTankTimerBoxText}>
              {careTankGameOver
                ? '0:00'
                : `${Math.floor(careTankTimeLeft / 60)}:${(
                    careTankTimeLeft % 60
                  )
                    .toString()
                    .padStart(2, '0')}`}
            </Text>
          </View>
        </View>
        <Pressable
          style={styles.careTankCloseBtn}
          onPress={careTankSaveAndExit}
        >
          <Image source={require('../AquaAssets/images/close.png')} />
        </Pressable>
      </View>

      <View
        style={[styles.careTankPlayArea, { height: careTankSafeHeight - 60 }]}
      >
        {careTankBubbles.map(careTankBubble => (
          <BubbleView
            key={careTankBubble.id}
            x={careTankBubble.x}
            size={careTankBubble.size}
            animY={careTankBubble.animY}
            onPress={() => careTankPopBubble(careTankBubble.id)}
          />
        ))}
      </View>

      <Modal
        visible={careTankGameOver}
        transparent
        animationType="fade"
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <View style={styles.careTankModalOverlay}>
          <View style={styles.careTankModalCard}>
            <Text style={styles.careTankModalTitle}>Water refreshed</Text>
            <Text style={styles.careTankModalMessage}>
              You cleared enough bubbles to help the tank breathe
            </Text>
            <View style={styles.careTankModalPointsBadge}>
              <Image
                source={require('../AquaAssets/images/points.png')}
                style={styles.careTankModalPointsIcon}
                resizeMode="contain"
              />
              <Text style={styles.careTankModalPointsText}>
                {careTankScore}
              </Text>
            </View>
            <View style={styles.careTankModalButtons}>
              <Pressable
                style={styles.careTankModalBtnBack}
                onPress={careTankSaveAndExit}
              >
                <Text style={styles.careTankModalBtnText}>Back</Text>
              </Pressable>
              <Pressable
                style={styles.careTankModalBtnAgain}
                onPress={careTankPlayAgain}
              >
                <Text style={styles.careTankModalBtnText}>Play Again</Text>
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
        styles.careTankBubbleWrap,
        {
          left: x,
          width: size,
          height: size,
          transform: [{ translateY: animY }],
        },
      ]}
    >
      <Pressable style={styles.careTankBubble} onPress={onPress}>
        <Image
          source={careTankBubbleImage}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  careTankContainer: {
    flex: 1,
    backgroundColor: '#011D5A',
  },
  careTankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  careTankScoreBox: {
    backgroundColor: '#02AD58',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 108,
    alignItems: 'center',
  },
  careTankScoreBoxText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  careTankTimerBox: {
    backgroundColor: '#45ACEC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 108,
  },
  careTankTimerBoxText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  careTankCloseBtn: {
    width: 48,
    height: 48,
    borderRadius: 22,
    backgroundColor: '#040523',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careTankPlayArea: {
    width: careTankScreenWidth,
    position: 'relative',
  },
  careTankBubbleWrap: {
    position: 'absolute',
    bottom: 0,
  },
  careTankBubble: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  careTankModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.23)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  careTankModalCard: {
    backgroundColor: '#040523',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    paddingHorizontal: 15,
  },
  careTankModalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 3,
  },
  careTankModalMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  careTankModalPointsBadge: {
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
  careTankModalPointsIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  careTankModalPointsText: {
    color: '#854E00',
    fontSize: 16,
    fontWeight: '600',
  },
  careTankModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  careTankModalBtnBack: {
    flex: 1,
    backgroundColor: '#011D5A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  careTankModalBtnAgain: {
    flex: 1,
    backgroundColor: '#02AD58',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  careTankModalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
