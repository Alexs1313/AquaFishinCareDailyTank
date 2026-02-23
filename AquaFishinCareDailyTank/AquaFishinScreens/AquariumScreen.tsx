import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  Pressable,
  Modal,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  ImageSourcePropType,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  COLLECTION_STORAGE_KEY,
  getCollectionItemById,
} from './FishCollectionScreen';
import Orientation from 'react-native-orientation-locker';

const STORAGE_KEY = 'AQUA_STATS_V1';
const TANK_TASKS_STORAGE_KEY = 'AQUA_TANK_TASKS_V1';
const DECAY_INTERVAL_MS = 60000;
const DECAY_PER_STEP = 5;

type Stats = {
  mood: number;
  cleanliness: number;
  satiety: number;
  lastUpdate: number;
};

const defaultStats: Stats = {
  mood: 50,
  cleanliness: 50,
  satiety: 50,
  lastUpdate: Date.now(),
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function applyDecay(stats: Stats, now: number): Stats {
  const elapsed = (now - stats.lastUpdate) / DECAY_INTERVAL_MS;
  if (elapsed < 1) return stats;
  const steps = Math.floor(elapsed);
  return {
    mood: clamp(stats.mood - steps * DECAY_PER_STEP),
    cleanliness: clamp(stats.cleanliness - steps * DECAY_PER_STEP),
    satiety: clamp(stats.satiety - steps * DECAY_PER_STEP),
    lastUpdate: stats.lastUpdate + steps * DECAY_INTERVAL_MS,
  };
}

const AQUARIUM_CLEAN = require('../AquaAssets/images/aquarium.png');
const AQUARIUM_DIRTY = require('../AquaAssets/images/aquarium.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AQUARIUM_HORIZONTAL_PADDING = 40;
const SWIM_FISH_WIDTH = 56;
const SWIM_FISH_HEIGHT = 44;
const AQUARIUM_HEIGHT = 180;

type TaskType = 'mood' | 'clean' | 'feed' | null;

type CollectionState = { unlocked: string[]; inAquarium: string[] };

const SWIM_FISH_TOP_BASE = (AQUARIUM_HEIGHT - SWIM_FISH_HEIGHT) / 0.8;
const SWIM_FISH_HEIGHT_OFFSET = 42;

function MainSwimmingFish({
  source,
  index,
}: {
  source: ImageSourcePropType;
  index: number;
}) {
  const startFromRight = index % 2 === 1;
  const swimX = useRef(new Animated.Value(startFromRight ? 1 : 0)).current;
  const swimY = useRef(new Animated.Value(0)).current;
  const fishScaleX = useRef(
    new Animated.Value(startFromRight ? -1 : 1),
  ).current;
  const duration = 5000 + index * 800;

  useEffect(() => {
    const swimRight = Animated.timing(swimX, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    });
    const swimLeft = Animated.timing(swimX, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    });
    const flipToLeft = Animated.timing(fishScaleX, {
      toValue: -1,
      duration: 1,
      useNativeDriver: true,
    });
    const flipToRight = Animated.timing(fishScaleX, {
      toValue: 1,
      duration: 1,
      useNativeDriver: true,
    });
    const swimLoop = Animated.loop(
      startFromRight
        ? Animated.sequence([swimLeft, flipToRight, swimRight, flipToLeft])
        : Animated.sequence([swimRight, flipToLeft, swimLeft, flipToRight]),
    );
    const startDelay = Animated.delay(index * 500);
    Animated.sequence([startDelay, swimLoop]).start();
    return () => swimLoop.stop();
  }, [swimX, fishScaleX, index, startFromRight]);

  useEffect(() => {
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(swimY, {
          toValue: 1,
          duration: 1800 + index * 200,
          useNativeDriver: true,
        }),
        Animated.timing(swimY, {
          toValue: 0,
          duration: 1800 + index * 200,
          useNativeDriver: true,
        }),
      ]),
    );
    bob.start();
    return () => bob.stop();
  }, [swimY, index]);

  const translateX = swimX.interpolate({
    inputRange: [0, 1],
    outputRange: [
      12,
      SCREEN_WIDTH - AQUARIUM_HORIZONTAL_PADDING - SWIM_FISH_WIDTH - 12,
    ],
  });
  const translateY = swimY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  const topOffset = SWIM_FISH_TOP_BASE + index * SWIM_FISH_HEIGHT_OFFSET;

  return (
    <Animated.Image
      source={source}
      style={[
        styles.swimmingFish,
        { top: topOffset },
        {
          transform: [{ translateX }, { translateY }, { scaleX: fishScaleX }],
        },
      ]}
      resizeMode="contain"
    />
  );
}

export default function AquariumScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [taskModal, setTaskModal] = useState<TaskType>(null);
  const [taskProgress, setTaskProgress] = useState(0);
  const [inAquariumIds, setInAquariumIds] = useState<string[]>([]);
  const [points, setPoints] = useState(0);
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);
  const termsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPoints = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(TANK_TASKS_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { points?: number };
      setPoints(data.points ?? 0);
    } catch {
      setPoints(0);
    }
  }, []);

  const loadInAquarium = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(COLLECTION_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as CollectionState;
      setInAquariumIds(data.inAquarium ?? []);
    } catch {
      setInAquariumIds([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPoints();
      loadInAquarium();

      Orientation.lockToPortrait();
      return () => {
        Orientation.unlockAllOrientations();
      };
    }, [loadPoints, loadInAquarium]),
  );

  const fishInAquarium = useMemo(
    () =>
      inAquariumIds
        .map(id => getCollectionItemById(id))
        .filter(
          (x): x is NonNullable<typeof x> => x != null && x.type === 'fish',
        ),
    [inAquariumIds],
  );
  const decorInAquarium = useMemo(
    () =>
      inAquariumIds
        .map(id => getCollectionItemById(id))
        .filter(
          (x): x is NonNullable<typeof x> => x != null && x.type === 'decor',
        ),
    [inAquariumIds],
  );

  const persist = useCallback(async (next: Stats) => {
    setStats(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Stats;
      const now = Date.now();
      const decayed = applyDecay(parsed, now);
      setStats(decayed);
      if (decayed.lastUpdate !== parsed.lastUpdate) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(decayed));
      }
    } catch {
      setStats(defaultStats);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (termsTimeoutRef.current) clearTimeout(termsTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setStats(prev => {
        const next = {
          mood: clamp(prev.mood - DECAY_PER_STEP),
          cleanliness: clamp(prev.cleanliness - DECAY_PER_STEP),
          satiety: clamp(prev.satiety - DECAY_PER_STEP),
          lastUpdate: prev.lastUpdate + DECAY_INTERVAL_MS,
        };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    }, DECAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const openTask = (task: TaskType) => {
    setTaskModal(task);
    setTaskProgress(0);
  };

  const closeTask = useCallback(() => {
    setTaskModal(null);
    setTaskProgress(0);
  }, []);

  useEffect(() => {
    if (taskProgress >= 100 && taskModal) {
      const next: Stats = { ...stats, lastUpdate: Date.now() };
      if (taskModal === 'mood') next.mood = 100;
      else if (taskModal === 'clean') next.cleanliness = 100;
      else if (taskModal === 'feed') next.satiety = 100;
      persist(next);
      closeTask();
    }
  }, [taskProgress, taskModal, stats, persist, closeTask]);

  const addTaskProgress = useCallback((delta: number) => {
    setTaskProgress(prev => Math.min(100, prev + delta));
  }, []);

  const aquariumBg = stats.cleanliness < 20 ? AQUARIUM_DIRTY : AQUARIUM_CLEAN;

  return (
    <View style={[styles.container]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.aquariumWrap}>
          <ImageBackground
            source={aquariumBg}
            style={styles.aquariumBg}
            resizeMode="cover"
          />

          <View style={styles.swimArea} pointerEvents="box-none">
            <View style={styles.header} pointerEvents="box-none">
              <View pointerEvents="none">
                <Text style={styles.title}>Your Aquarium</Text>
                <Text style={styles.subtitle}>
                  A calm space that grows with daily care
                </Text>
                <View style={styles.badge}>
                  <Image source={require('../AquaAssets/images/points.png')} />
                  <Text style={styles.badgeText}>{points}</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.settingsBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (termsTimeoutRef.current) {
                        clearTimeout(termsTimeoutRef.current);
                        termsTimeoutRef.current = null;
                      }
                      setShowTermsOfUse(prev => {
                        const next = !prev;
                        if (next) {
                          termsTimeoutRef.current = setTimeout(() => {
                            setShowTermsOfUse(false);
                            termsTimeoutRef.current = null;
                          }, 7000);
                        }
                        return next;
                      });
                    }}
                  >
                    <Image
                      source={require('../AquaAssets/images/settings.png')}
                      style={styles.settingsBtnIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
                {showTermsOfUse && (
                  <Pressable
                    style={styles.termsOfUseBtn}
                    onPress={() =>
                      Linking.openURL(
                        'https://www.termsfeed.com/live/df59e493-abff-4ac4-9ec1-366a92930b71',
                      )
                    }
                  >
                    <Text style={styles.termsOfUseBtnText}>Terms of Use</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {fishInAquarium.map((item, i) => (
              <MainSwimmingFish key={item.id} source={item.image} index={i} />
            ))}
            {decorInAquarium.length > 0 && (
              <View style={styles.decorRow}>
                {decorInAquarium.map(item => (
                  <Image
                    key={item.id}
                    source={item.image}
                    style={styles.decorInTank}
                    resizeMode="contain"
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.bars}>
          <View style={styles.barRow}>
            <View style={[styles.barLabel, styles.barLabelMood]}>
              <Text style={styles.barLabelText}>Mood</Text>
            </View>
            <Text style={styles.barPct}>{stats.mood}%</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                styles.barFillMood,
                { width: `${stats.mood}%` },
              ]}
            />
          </View>
          <View style={styles.barRow}>
            <View style={[styles.barLabel, styles.barLabelClean]}>
              <Text style={styles.barLabelText}>Cleanliness</Text>
            </View>
            <Text style={styles.barPct}>{stats.cleanliness}%</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                styles.barFillClean,
                { width: `${stats.cleanliness}%` },
              ]}
            />
          </View>
          <View style={styles.barRow}>
            <View style={[styles.barLabel, styles.barLabelSatiety]}>
              <Text style={styles.barLabelText}>Satiety</Text>
            </View>
            <Text style={styles.barPct}>{stats.satiety}%</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                styles.barFillSatiety,
                { width: `${stats.satiety}%` },
              ]}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.sectionTitle}>Active Fish</Text>
          <View style={styles.fishCardRow}>
            {fishInAquarium.map(item => (
              <View key={item.id} style={styles.fishCard}>
                <Image
                  source={item.image}
                  style={styles.fishIcon}
                  resizeMode="contain"
                />
                <Text style={styles.fishName} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.btnPlay]}
              onPress={() => openTask('mood')}
            >
              <Text style={styles.btnText}>Play</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnClean]}
              onPress={() => openTask('clean')}
            >
              <Text style={styles.btnText}>Clean</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnFeed]}
              onPress={() => openTask('feed')}
            >
              <Text style={styles.btnText}>Feed</Text>
            </Pressable>
          </View>
        </View>

        <TaskModalMood
          visible={taskModal === 'mood'}
          progress={taskProgress}
          onProgress={addTaskProgress}
          onCancel={closeTask}
        />
        <TaskModalClean
          visible={taskModal === 'clean'}
          progress={taskProgress}
          onProgress={addTaskProgress}
          onCancel={closeTask}
        />
        <TaskModalFeed
          visible={taskModal === 'feed'}
          progress={taskProgress}
          onProgress={addTaskProgress}
          onCancel={closeTask}
        />
      </ScrollView>
    </View>
  );
}

const MODAL_AREA_HEIGHT = 200;
const MODAL_FISH_SIZE = 44;
const MODAL_CARD_PADDING = 48;

const modalFishStyle = StyleSheet.create({
  wrap: {
    position: 'absolute' as const,
    left: 0,
    width: MODAL_FISH_SIZE,
    height: MODAL_FISH_SIZE,
  },
  pressable: {
    width: '100%' as const,
    height: '100%' as const,
  },
  image: {
    width: MODAL_FISH_SIZE,
    height: MODAL_FISH_SIZE,
  },
});

function SwimmingFishModal({
  index,
  onPress,
}: {
  index: number;
  onPress: () => void;
}) {
  const startFromRight = index % 2 === 1;
  const swimX = useRef(new Animated.Value(startFromRight ? 1 : 0)).current;
  const swimY = useRef(new Animated.Value(0)).current;
  const fishScaleX = useRef(
    new Animated.Value(startFromRight ? -1 : 1),
  ).current;

  const maxX = SCREEN_WIDTH - MODAL_CARD_PADDING - MODAL_FISH_SIZE - 16;

  useEffect(() => {
    const duration = 4000 + index * 600;
    const swimRight = Animated.timing(swimX, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    });
    const swimLeft = Animated.timing(swimX, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    });
    const flipToLeft = Animated.timing(fishScaleX, {
      toValue: -1,
      duration: 1,
      useNativeDriver: true,
    });
    const flipToRight = Animated.timing(fishScaleX, {
      toValue: 1,
      duration: 1,
      useNativeDriver: true,
    });
    const swimLoop = Animated.loop(
      startFromRight
        ? Animated.sequence([swimLeft, flipToRight, swimRight, flipToLeft])
        : Animated.sequence([swimRight, flipToLeft, swimLeft, flipToRight]),
    );
    const startDelay = Animated.delay(index * 800);
    Animated.sequence([startDelay, swimLoop]).start();
    return () => swimLoop.stop();
  }, [swimX, fishScaleX, index, startFromRight]);

  useEffect(() => {
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(swimY, {
          toValue: 1,
          duration: 1500 + index * 200,
          useNativeDriver: true,
        }),
        Animated.timing(swimY, {
          toValue: 0,
          duration: 1500 + index * 200,
          useNativeDriver: true,
        }),
      ]),
    );
    bob.start();
    return () => bob.stop();
  }, [swimY, index]);

  const translateX = swimX.interpolate({
    inputRange: [0, 1],
    outputRange: [12, maxX],
  });
  const translateY = swimY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6],
  });
  const topOffset =
    (MODAL_AREA_HEIGHT - MODAL_FISH_SIZE) / 2 + (index - 1) * 36;

  return (
    <Animated.View
      style={[
        modalFishStyle.wrap,
        {
          top: topOffset,
          transform: [{ translateX }, { translateY }, { scaleX: fishScaleX }],
        },
      ]}
    >
      <Pressable onPress={onPress} style={modalFishStyle.pressable} hitSlop={8}>
        <Image
          source={require('../AquaAssets/images/fish.png')}
          style={modalFishStyle.image}
          resizeMode="contain"
        />
      </Pressable>
    </Animated.View>
  );
}

function TaskModalMood({
  visible,
  progress,
  onProgress,
  onCancel,
}: {
  visible: boolean;
  progress: number;
  onProgress: (delta: number) => void;
  onCancel: () => void;
}) {
  const onTap = () => onProgress(10);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>Tap to Cheer Them Up</Text>
          <Text style={modalStyles.instruction}>
            Gently tap your fish to play with them and lift the tank's mood
          </Text>
          <View style={modalStyles.barRow}>
            <View style={[modalStyles.barLabel, modalStyles.barLabelMood]}>
              <Text style={modalStyles.barLabelText}>Mood</Text>
            </View>
            <Text style={modalStyles.barPct}>{progress}%</Text>
          </View>
          <View style={modalStyles.barTrack}>
            <View
              style={[
                modalStyles.barFill,
                modalStyles.barFillMood,
                { width: `${progress}%` },
              ]}
            />
          </View>
          <ImageBackground
            source={require('../AquaAssets/images/aquarium.png')}
            style={modalStyles.aquariumFull}
          >
            <View style={modalStyles.area}>
              <SwimmingFishModal index={0} onPress={onTap} />
              <SwimmingFishModal index={1} onPress={onTap} />
              <SwimmingFishModal index={2} onPress={onTap} />
            </View>
          </ImageBackground>
          <Pressable style={modalStyles.cancelBtn} onPress={onCancel}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function TaskModalClean({
  visible,
  progress,
  onProgress,
  onCancel,
}: {
  visible: boolean;
  progress: number;
  onProgress: (delta: number) => void;
  onCancel: () => void;
}) {
  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderRelease: () => onProgress(10),
  });
  const overlayOpacity = 1 - progress / 100;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>Wipe for a Clear View</Text>
          <Text style={modalStyles.instruction}>
            Swipe across the glass to remove dirt and keep the water looking
            clean
          </Text>
          <View style={modalStyles.barRow}>
            <View style={[modalStyles.barLabel, modalStyles.barLabelClean]}>
              <Text style={modalStyles.barLabelText}>Cleanliness</Text>
            </View>
            <Text style={modalStyles.barPct}>{progress}%</Text>
          </View>
          <View style={modalStyles.barTrack}>
            <View
              style={[
                modalStyles.barFill,
                modalStyles.barFillClean,
                { width: `${progress}%` },
              ]}
            />
          </View>
          <ImageBackground
            source={require('../AquaAssets/images/aquarium.png')}
            style={modalStyles.aquariumFull}
          >
            <View style={modalStyles.aquariumTapArea} {...pan.panHandlers}>
              <SwimmingFishModal index={0} onPress={() => {}} />
              <SwimmingFishModal index={1} onPress={() => {}} />
              <SwimmingFishModal index={2} onPress={() => {}} />
              <View
                style={[modalStyles.cleanOverlay, { opacity: overlayOpacity }]}
                pointerEvents="none"
              />
            </View>
          </ImageBackground>
          <Pressable style={modalStyles.cancelBtn} onPress={onCancel}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function TaskModalFeed({
  visible,
  progress,
  onProgress,
  onCancel,
}: {
  visible: boolean;
  progress: number;
  onProgress: (delta: number) => void;
  onCancel: () => void;
}) {
  const [foodSpots, setFoodSpots] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  const handleFeedTap = useCallback(
    (e: { nativeEvent: { locationX: number; locationY: number } }) => {
      const { locationX, locationY } = e.nativeEvent;
      const id = Date.now();
      setFoodSpots(prev => [...prev, { id, x: locationX, y: locationY }]);
      onProgress(10);
      setTimeout(() => {
        setFoodSpots(prev => prev.filter(f => f.id !== id));
      }, 2000);
    },
    [onProgress],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>Tap to Feed the Tank</Text>
          <Text style={modalStyles.instruction}>
            Tap anywhere in the water to drop food — watch the fish gather and
            eat
          </Text>
          <View style={modalStyles.barRow}>
            <View style={[modalStyles.barLabel, modalStyles.barLabelSatiety]}>
              <Text style={modalStyles.barLabelText}>Satiety</Text>
            </View>
            <Text style={modalStyles.barPct}>{progress}%</Text>
          </View>
          <View style={modalStyles.barTrack}>
            <View
              style={[
                modalStyles.barFill,
                modalStyles.barFillSatiety,
                { width: `${progress}%` },
              ]}
            />
          </View>
          <ImageBackground
            source={require('../AquaAssets/images/aquarium.png')}
            style={modalStyles.aquariumFull}
          >
            <View
              style={modalStyles.aquariumTapArea}
              onStartShouldSetResponder={() => true}
              onResponderGrant={handleFeedTap}
            >
              <SwimmingFishModal index={0} onPress={() => {}} />
              <SwimmingFishModal index={1} onPress={() => {}} />
              <SwimmingFishModal index={2} onPress={() => {}} />
              {foodSpots.map(f => (
                <Image
                  source={require('../AquaAssets/images/feed.png')}
                  key={f.id}
                  style={[
                    modalStyles.foodSpot,
                    { left: f.x - 10, top: f.y - 10 },
                  ]}
                />
              ))}
            </View>
          </ImageBackground>
          <Pressable style={modalStyles.cancelBtn} onPress={onCancel}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#011D5A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#FF9600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: '30%',
    marginTop: 8,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  termsOfUseBtn: {
    backgroundColor: '#040523',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  termsOfUseBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsBtn: {
    width: 48,
    height: 48,
    borderRadius: 52,
    backgroundColor: '#040523',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnIcon: {
    width: 24,
    height: 24,
  },

  aquariumWrap: {
    height: 420,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  aquariumBg: {
    width: '100%',
    height: '100%',
  },
  swimArea: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    paddingTop: 50,
  },
  swimmingFish: {
    position: 'absolute',
    left: 0,
    top: (AQUARIUM_HEIGHT - SWIM_FISH_HEIGHT) / 2,
    width: SWIM_FISH_WIDTH,
    height: SWIM_FISH_HEIGHT,
  },
  decorRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  decorInTank: {
    width: 44,
    height: 44,
    marginVertical: 4,
  },
  fishCardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  bars: {
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barLabel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 90,
  },
  barLabelMood: { backgroundColor: '#02AD58' },
  barLabelClean: { backgroundColor: '#45ACEC' },
  barLabelSatiety: { backgroundColor: '#FF8A8A' },
  barLabelText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  barTrack: {
    width: '100%' as const,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  barFillMood: { backgroundColor: '#02AD58' },
  barFillClean: { backgroundColor: '#45ACEC' },
  barFillSatiety: { backgroundColor: '#FF8A8A' },
  barPct: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    width: 46,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  fishCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    width: '30%',
  },
  fishIcon: {
    marginBottom: 8,
    width: 64,
    height: 44,
  },
  fishName: {
    color: '#fff',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPlay: { backgroundColor: '#02AD58' },
  btnClean: { backgroundColor: '#45ACEC' },
  btnFeed: { backgroundColor: '#FF8A8A' },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#191936',
    borderRadius: 20,
    padding: 24,
    maxHeight: '85%',
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  instruction: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  barLabel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  barLabelMood: { backgroundColor: '#02AD58' },
  barLabelClean: { backgroundColor: '#45ACEC' },
  barLabelSatiety: { backgroundColor: '#FF8A8A' },
  barLabelText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  barTrack: {
    width: '100%' as const,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
    marginTop: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barFillMood: { backgroundColor: '#02AD58' },
  barFillClean: { backgroundColor: '#45ACEC' },
  barFillSatiety: { backgroundColor: '#FF8A8A' },
  barPct: { color: '#fff', fontSize: 13, width: 32, textAlign: 'right' },
  area: {
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  aquariumFull: {
    width: '100%' as const,
    height: 334,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  aquariumTapArea: {
    flex: 1,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  cleanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  foodSpot: {
    position: 'absolute' as const,
    width: 20,
    height: 20,
    opacity: 0.95,
  },
  wipeHint: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(90,180,220,0.4)',
  },
  cancelBtn: {
    backgroundColor: '#011D5A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: { color: '#fff', fontSize: 16, fontWeight: '400' },
});
