//AquariumScreen

import {
  COLLECTION_STORAGE_KEY,
  getCollectionItemById,
} from './FishCollectionScreen';

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

import Orientation from 'react-native-orientation-locker';

const careTankStorageKey = 'AQUA_STATS_V1';
const careTankTasksStorageKey = 'AQUA_TANK_TASKS_V1';
const careTankDecayIntervalMs = 60000;
const careTankDecayPerStep = 5;

type Stats = {
  mood: number;
  cleanliness: number;
  satiety: number;
  lastUpdate: number;
};

const careTankDefaultStats: Stats = {
  mood: 50,
  cleanliness: 50,
  satiety: 50,
  lastUpdate: Date.now(),
};

const careTankClamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function careTankApplyDecay(stats: Stats, now: number): Stats {
  const careTankElapsed = (now - stats.lastUpdate) / careTankDecayIntervalMs;
  if (careTankElapsed < 1) return stats;
  const careTankSteps = Math.floor(careTankElapsed);
  return {
    mood: careTankClamp(stats.mood - careTankSteps * careTankDecayPerStep),
    cleanliness: careTankClamp(
      stats.cleanliness - careTankSteps * careTankDecayPerStep,
    ),
    satiety: careTankClamp(
      stats.satiety - careTankSteps * careTankDecayPerStep,
    ),
    lastUpdate: stats.lastUpdate + careTankSteps * careTankDecayIntervalMs,
  };
}

const careTankAquariumClean = require('../AquaAssets/images/aquarium.png');
const careTankAquariumDirty = require('../AquaAssets/images/aquarium.png');

const { width: careTankScreenWidth } = Dimensions.get('window');
const careTankAquariumHorizontalPadding = 40;
const careTankSwimFishWidth = 56;
const careTankSwimFishHeight = 44;
const careTankAquariumHeight = 180;

type TaskType = 'mood' | 'clean' | 'feed' | null;

type CollectionState = { unlocked: string[]; inAquarium: string[] };

const careTankSwimFishTopBase =
  (careTankAquariumHeight - careTankSwimFishHeight) / 0.8;
const careTankSwimFishHeightOffset = 42;

function MainSwimmingFish({
  source,
  index,
}: {
  source: ImageSourcePropType;
  index: number;
}) {
  const careTankStartFromRight = index % 2 === 1;
  const careTankSwimX = useRef(
    new Animated.Value(careTankStartFromRight ? 1 : 0),
  ).current;
  const careTankSwimY = useRef(new Animated.Value(0)).current;
  const careTankFishScaleX = useRef(
    new Animated.Value(careTankStartFromRight ? -1 : 1),
  ).current;
  const careTankDuration = 5000 + index * 800;

  useEffect(() => {
    const careTankSwimRight = Animated.timing(careTankSwimX, {
      toValue: 1,
      duration: careTankDuration,
      useNativeDriver: true,
    });
    const careTankSwimLeft = Animated.timing(careTankSwimX, {
      toValue: 0,
      duration: careTankDuration,
      useNativeDriver: true,
    });
    const careTankFlipToLeft = Animated.timing(careTankFishScaleX, {
      toValue: -1,
      duration: 1,
      useNativeDriver: true,
    });
    const careTankFlipToRight = Animated.timing(careTankFishScaleX, {
      toValue: 1,
      duration: 1,
      useNativeDriver: true,
    });
    const careTankSwimLoop = Animated.loop(
      careTankStartFromRight
        ? Animated.sequence([
            careTankSwimLeft,
            careTankFlipToRight,
            careTankSwimRight,
            careTankFlipToLeft,
          ])
        : Animated.sequence([
            careTankSwimRight,
            careTankFlipToLeft,
            careTankSwimLeft,
            careTankFlipToRight,
          ]),
    );
    const careTankStartDelay = Animated.delay(index * 500);
    Animated.sequence([careTankStartDelay, careTankSwimLoop]).start();
    return () => careTankSwimLoop.stop();
  }, [
    careTankSwimX,
    careTankFishScaleX,
    index,
    careTankStartFromRight,
    careTankDuration,
  ]);

  useEffect(() => {
    const careTankBob = Animated.loop(
      Animated.sequence([
        Animated.timing(careTankSwimY, {
          toValue: 1,
          duration: 1800 + index * 200,
          useNativeDriver: true,
        }),
        Animated.timing(careTankSwimY, {
          toValue: 0,
          duration: 1800 + index * 200,
          useNativeDriver: true,
        }),
      ]),
    );
    careTankBob.start();
    return () => careTankBob.stop();
  }, [careTankSwimY, index]);

  const careTankTranslateX = careTankSwimX.interpolate({
    inputRange: [0, 1],
    outputRange: [
      12,
      careTankScreenWidth -
        careTankAquariumHorizontalPadding -
        careTankSwimFishWidth -
        12,
    ],
  });
  const careTankTranslateY = careTankSwimY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  const careTankTopOffset =
    careTankSwimFishTopBase + index * careTankSwimFishHeightOffset;

  return (
    <Animated.Image
      source={source}
      style={[
        styles.careTankSwimmingFish,
        { top: careTankTopOffset },
        {
          transform: [
            { translateX: careTankTranslateX },
            { translateY: careTankTranslateY },
            { scaleX: careTankFishScaleX },
          ],
        },
      ]}
      resizeMode="contain"
    />
  );
}

export default function AquariumScreen() {
  const careTankInsets = useSafeAreaInsets();
  const [careTankStats, setCareTankStats] =
    useState<Stats>(careTankDefaultStats);
  const [careTankTaskModal, setCareTankTaskModal] = useState<TaskType>(null);
  const [careTankTaskProgress, setCareTankTaskProgress] = useState(0);
  const [careTankInAquariumIds, setCareTankInAquariumIds] = useState<string[]>(
    [],
  );
  const [careTankPoints, setCareTankPoints] = useState(0);
  const [careTankShowTermsOfUse, setCareTankShowTermsOfUse] = useState(false);
  const careTankTermsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const careTankLoadPoints = async () => {
    try {
      const careTankRaw = await AsyncStorage.getItem(careTankTasksStorageKey);
      if (!careTankRaw) return;
      const careTankData = JSON.parse(careTankRaw) as { points?: number };
      setCareTankPoints(careTankData.points ?? 0);
    } catch {
      setCareTankPoints(0);
    }
  };

  const careTankLoadInAquarium = async () => {
    try {
      const careTankRaw = await AsyncStorage.getItem(COLLECTION_STORAGE_KEY);
      if (!careTankRaw) return;
      const careTankData = JSON.parse(careTankRaw) as CollectionState;
      setCareTankInAquariumIds(careTankData.inAquarium ?? []);
    } catch {
      setCareTankInAquariumIds([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      careTankLoadPoints();
      careTankLoadInAquarium();

      Orientation.lockToPortrait();
      return () => {
        Orientation.unlockAllOrientations();
      };
    }, []),
  );

  const careTankFishInAquarium = useMemo(
    () =>
      careTankInAquariumIds
        .map(id => getCollectionItemById(id))
        .filter(
          (x): x is NonNullable<typeof x> => x != null && x.type === 'fish',
        ),
    [careTankInAquariumIds],
  );

  const careTankDecorInAquarium = useMemo(
    () =>
      careTankInAquariumIds
        .map(id => getCollectionItemById(id))
        .filter(
          (x): x is NonNullable<typeof x> => x != null && x.type === 'decor',
        ),
    [careTankInAquariumIds],
  );

  const careTankPersist = async (next: Stats) => {
    setCareTankStats(next);
    try {
      await AsyncStorage.setItem(careTankStorageKey, JSON.stringify(next));
    } catch {}
  };

  const careTankLoad = async () => {
    try {
      const careTankRaw = await AsyncStorage.getItem(careTankStorageKey);
      if (!careTankRaw) return;
      const careTankParsed = JSON.parse(careTankRaw) as Stats;
      const careTankNow = Date.now();
      const careTankDecayed = careTankApplyDecay(careTankParsed, careTankNow);
      setCareTankStats(careTankDecayed);
      if (careTankDecayed.lastUpdate !== careTankParsed.lastUpdate) {
        await AsyncStorage.setItem(
          careTankStorageKey,
          JSON.stringify(careTankDecayed),
        );
      }
    } catch {
      setCareTankStats(careTankDefaultStats);
    }
  };

  useEffect(() => {
    careTankLoad();
  }, []);

  useEffect(() => {
    return () => {
      if (careTankTermsTimeoutRef.current) {
        clearTimeout(careTankTermsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const careTankIntervalId = setInterval(() => {
      setCareTankStats(prev => {
        const careTankNext = {
          mood: careTankClamp(prev.mood - careTankDecayPerStep),
          cleanliness: careTankClamp(prev.cleanliness - careTankDecayPerStep),
          satiety: careTankClamp(prev.satiety - careTankDecayPerStep),
          lastUpdate: prev.lastUpdate + careTankDecayIntervalMs,
        };
        AsyncStorage.setItem(
          careTankStorageKey,
          JSON.stringify(careTankNext),
        ).catch(() => {});
        return careTankNext;
      });
    }, careTankDecayIntervalMs);
    return () => clearInterval(careTankIntervalId);
  }, []);

  const careTankOpenTask = (task: TaskType) => {
    setCareTankTaskModal(task);
    setCareTankTaskProgress(0);
  };

  const careTankCloseTask = () => {
    setCareTankTaskModal(null);
    setCareTankTaskProgress(0);
  };

  useEffect(() => {
    if (careTankTaskProgress >= 100 && careTankTaskModal) {
      const careTankNext: Stats = {
        ...careTankStats,
        lastUpdate: Date.now(),
      };
      if (careTankTaskModal === 'mood') careTankNext.mood = 100;
      else if (careTankTaskModal === 'clean') careTankNext.cleanliness = 100;
      else if (careTankTaskModal === 'feed') careTankNext.satiety = 100;
      careTankPersist(careTankNext);
      careTankCloseTask();
    }
  }, [careTankTaskProgress, careTankTaskModal, careTankStats]);

  const careTankAddTaskProgress = (delta: number) => {
    setCareTankTaskProgress(prev => Math.min(100, prev + delta));
  };

  const careTankAquariumBg =
    careTankStats.cleanliness < 20
      ? careTankAquariumDirty
      : careTankAquariumClean;

  return (
    <View style={[styles.careTankContainer]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{
          paddingBottom: 100,
          paddingTop: careTankInsets.top ? 0 : 0,
        }}
      >
        <View style={styles.careTankAquariumWrap}>
          <ImageBackground
            source={careTankAquariumBg}
            style={styles.careTankAquariumBg}
            resizeMode="cover"
          />

          <View style={styles.careTankSwimArea} pointerEvents="box-none">
            <View style={styles.careTankHeader} pointerEvents="box-none">
              <View pointerEvents="none">
                <Text style={styles.careTankTitle}>Your Aquarium</Text>
                <Text style={styles.careTankSubtitle}>
                  A calm space that grows with daily care
                </Text>
                <View style={styles.careTankBadge}>
                  <Image source={require('../AquaAssets/images/points.png')} />
                  <Text style={styles.careTankBadgeText}>{careTankPoints}</Text>
                </View>
              </View>
              <View style={styles.careTankHeaderRight}>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.careTankSettingsBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (careTankTermsTimeoutRef.current) {
                        clearTimeout(careTankTermsTimeoutRef.current);
                        careTankTermsTimeoutRef.current = null;
                      }
                      setCareTankShowTermsOfUse(prev => {
                        const careTankNext = !prev;
                        if (careTankNext) {
                          careTankTermsTimeoutRef.current = setTimeout(() => {
                            setCareTankShowTermsOfUse(false);
                            careTankTermsTimeoutRef.current = null;
                          }, 7000);
                        }
                        return careTankNext;
                      });
                    }}
                  >
                    <Image
                      source={require('../AquaAssets/images/settings.png')}
                      style={styles.careTankSettingsBtnIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
                {careTankShowTermsOfUse && (
                  <Pressable
                    style={styles.careTankTermsOfUseBtn}
                    onPress={() =>
                      Linking.openURL(
                        'https://www.termsfeed.com/live/df59e493-abff-4ac4-9ec1-366a92930b71',
                      )
                    }
                  >
                    <Text style={styles.careTankTermsOfUseBtnText}>
                      Terms of Use
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {careTankFishInAquarium.map((item, i) => (
              <MainSwimmingFish key={item.id} source={item.image} index={i} />
            ))}
            {careTankDecorInAquarium.length > 0 && (
              <View style={styles.careTankDecorRow}>
                {careTankDecorInAquarium.map(item => (
                  <Image
                    key={item.id}
                    source={item.image}
                    style={styles.careTankDecorInTank}
                    resizeMode="contain"
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.careTankBars}>
          <View style={styles.careTankBarRow}>
            <View
              style={[styles.careTankBarLabel, styles.careTankBarLabelMood]}
            >
              <Text style={styles.careTankBarLabelText}>Mood</Text>
            </View>
            <Text style={styles.careTankBarPct}>{careTankStats.mood}%</Text>
          </View>
          <View style={styles.careTankBarTrack}>
            <View
              style={[
                styles.careTankBarFill,
                styles.careTankBarFillMood,
                { width: `${careTankStats.mood}%` },
              ]}
            />
          </View>
          <View style={styles.careTankBarRow}>
            <View
              style={[styles.careTankBarLabel, styles.careTankBarLabelClean]}
            >
              <Text style={styles.careTankBarLabelText}>Cleanliness</Text>
            </View>
            <Text style={styles.careTankBarPct}>
              {careTankStats.cleanliness}%
            </Text>
          </View>
          <View style={styles.careTankBarTrack}>
            <View
              style={[
                styles.careTankBarFill,
                styles.careTankBarFillClean,
                { width: `${careTankStats.cleanliness}%` },
              ]}
            />
          </View>
          <View style={styles.careTankBarRow}>
            <View
              style={[styles.careTankBarLabel, styles.careTankBarLabelSatiety]}
            >
              <Text style={styles.careTankBarLabelText}>Satiety</Text>
            </View>
            <Text style={styles.careTankBarPct}>{careTankStats.satiety}%</Text>
          </View>
          <View style={styles.careTankBarTrack}>
            <View
              style={[
                styles.careTankBarFill,
                styles.careTankBarFillSatiety,
                { width: `${careTankStats.satiety}%` },
              ]}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.careTankSectionTitle}>Active Fish</Text>
          <View style={styles.careTankFishCardRow}>
            {careTankFishInAquarium.map(item => (
              <View key={item.id} style={styles.careTankFishCard}>
                <Image
                  source={item.image}
                  style={styles.careTankFishIcon}
                  resizeMode="contain"
                />
                <Text style={styles.careTankFishName} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.careTankActions}>
            <Pressable
              style={[styles.careTankBtn, styles.careTankBtnPlay]}
              onPress={() => careTankOpenTask('mood')}
            >
              <Text style={styles.careTankBtnText}>Play</Text>
            </Pressable>
            <Pressable
              style={[styles.careTankBtn, styles.careTankBtnClean]}
              onPress={() => careTankOpenTask('clean')}
            >
              <Text style={styles.careTankBtnText}>Clean</Text>
            </Pressable>
            <Pressable
              style={[styles.careTankBtn, styles.careTankBtnFeed]}
              onPress={() => careTankOpenTask('feed')}
            >
              <Text style={styles.careTankBtnText}>Feed</Text>
            </Pressable>
          </View>
        </View>

        <TaskModalMood
          visible={careTankTaskModal === 'mood'}
          progress={careTankTaskProgress}
          onProgress={careTankAddTaskProgress}
          onCancel={careTankCloseTask}
        />
        <TaskModalClean
          visible={careTankTaskModal === 'clean'}
          progress={careTankTaskProgress}
          onProgress={careTankAddTaskProgress}
          onCancel={careTankCloseTask}
        />
        <TaskModalFeed
          visible={careTankTaskModal === 'feed'}
          progress={careTankTaskProgress}
          onProgress={careTankAddTaskProgress}
          onCancel={careTankCloseTask}
        />
      </ScrollView>
    </View>
  );
}

const careTankModalAreaHeight = 200;
const careTankModalFishSize = 44;
const careTankModalCardPadding = 48;

const careTankModalFishStyle = StyleSheet.create({
  careTankWrap: {
    position: 'absolute' as const,
    left: 0,
    width: careTankModalFishSize,
    height: careTankModalFishSize,
  },
  careTankPressable: {
    width: '100%' as const,
    height: '100%' as const,
  },
  careTankImage: {
    width: careTankModalFishSize,
    height: careTankModalFishSize,
  },
});

function SwimmingFishModal({
  index,
  onPress,
}: {
  index: number;
  onPress: () => void;
}) {
  const careTankStartFromRight = index % 2 === 1;
  const careTankSwimX = useRef(
    new Animated.Value(careTankStartFromRight ? 1 : 0),
  ).current;
  const careTankSwimY = useRef(new Animated.Value(0)).current;
  const careTankFishScaleX = useRef(
    new Animated.Value(careTankStartFromRight ? -1 : 1),
  ).current;

  const careTankMaxX =
    careTankScreenWidth - careTankModalCardPadding - careTankModalFishSize - 16;

  useEffect(() => {
    const careTankDuration = 4000 + index * 600;
    const careTankSwimRight = Animated.timing(careTankSwimX, {
      toValue: 1,
      duration: careTankDuration,
      useNativeDriver: true,
    });
    const careTankSwimLeft = Animated.timing(careTankSwimX, {
      toValue: 0,
      duration: careTankDuration,
      useNativeDriver: true,
    });
    const careTankFlipToLeft = Animated.timing(careTankFishScaleX, {
      toValue: -1,
      duration: 1,
      useNativeDriver: true,
    });
    const careTankFlipToRight = Animated.timing(careTankFishScaleX, {
      toValue: 1,
      duration: 1,
      useNativeDriver: true,
    });
    const careTankSwimLoop = Animated.loop(
      careTankStartFromRight
        ? Animated.sequence([
            careTankSwimLeft,
            careTankFlipToRight,
            careTankSwimRight,
            careTankFlipToLeft,
          ])
        : Animated.sequence([
            careTankSwimRight,
            careTankFlipToLeft,
            careTankSwimLeft,
            careTankFlipToRight,
          ]),
    );
    const careTankStartDelay = Animated.delay(index * 800);
    Animated.sequence([careTankStartDelay, careTankSwimLoop]).start();
    return () => careTankSwimLoop.stop();
  }, [
    careTankSwimX,
    careTankFishScaleX,
    index,
    careTankStartFromRight,
    careTankMaxX,
  ]);

  useEffect(() => {
    const careTankBob = Animated.loop(
      Animated.sequence([
        Animated.timing(careTankSwimY, {
          toValue: 1,
          duration: 1500 + index * 200,
          useNativeDriver: true,
        }),
        Animated.timing(careTankSwimY, {
          toValue: 0,
          duration: 1500 + index * 200,
          useNativeDriver: true,
        }),
      ]),
    );
    careTankBob.start();
    return () => careTankBob.stop();
  }, [careTankSwimY, index]);

  const careTankTranslateX = careTankSwimX.interpolate({
    inputRange: [0, 1],
    outputRange: [12, careTankMaxX],
  });
  const careTankTranslateY = careTankSwimY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6],
  });
  const careTankTopOffset =
    (careTankModalAreaHeight - careTankModalFishSize) / 2 + (index - 1) * 36;

  return (
    <Animated.View
      style={[
        careTankModalFishStyle.careTankWrap,
        {
          top: careTankTopOffset,
          transform: [
            { translateX: careTankTranslateX },
            { translateY: careTankTranslateY },
            { scaleX: careTankFishScaleX },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={careTankModalFishStyle.careTankPressable}
        hitSlop={8}
      >
        <Image
          source={require('../AquaAssets/images/fish.png')}
          style={careTankModalFishStyle.careTankImage}
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
  const careTankOnTap = () => onProgress(10);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={careTankModalStyles.careTankOverlay}>
        <View style={careTankModalStyles.careTankCard}>
          <Text style={careTankModalStyles.careTankTitle}>
            Tap to Cheer Them Up
          </Text>
          <Text style={careTankModalStyles.careTankInstruction}>
            Gently tap your fish to play with them and lift the tank&apos;s mood
          </Text>
          <View style={careTankModalStyles.careTankBarRow}>
            <View
              style={[
                careTankModalStyles.careTankBarLabel,
                careTankModalStyles.careTankBarLabelMood,
              ]}
            >
              <Text style={careTankModalStyles.careTankBarLabelText}>Mood</Text>
            </View>
            <Text style={careTankModalStyles.careTankBarPct}>{progress}%</Text>
          </View>
          <View style={careTankModalStyles.careTankBarTrack}>
            <View
              style={[
                careTankModalStyles.careTankBarFill,
                careTankModalStyles.careTankBarFillMood,
                { width: `${progress}%` },
              ]}
            />
          </View>
          <ImageBackground
            source={require('../AquaAssets/images/aquarium.png')}
            style={careTankModalStyles.careTankAquariumFull}
          >
            <View style={careTankModalStyles.careTankArea}>
              <SwimmingFishModal index={0} onPress={careTankOnTap} />
              <SwimmingFishModal index={1} onPress={careTankOnTap} />
              <SwimmingFishModal index={2} onPress={careTankOnTap} />
            </View>
          </ImageBackground>
          <Pressable
            style={careTankModalStyles.careTankCancelBtn}
            onPress={onCancel}
          >
            <Text style={careTankModalStyles.careTankCancelText}>Cancel</Text>
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
  const careTankPan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderRelease: () => onProgress(10),
  });
  const careTankOverlayOpacity = 1 - progress / 100;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={careTankModalStyles.careTankOverlay}>
        <View style={careTankModalStyles.careTankCard}>
          <Text style={careTankModalStyles.careTankTitle}>
            Wipe for a Clear View
          </Text>
          <Text style={careTankModalStyles.careTankInstruction}>
            Swipe across the glass to remove dirt and keep the water looking
            clean
          </Text>
          <View style={careTankModalStyles.careTankBarRow}>
            <View
              style={[
                careTankModalStyles.careTankBarLabel,
                careTankModalStyles.careTankBarLabelClean,
              ]}
            >
              <Text style={careTankModalStyles.careTankBarLabelText}>
                Cleanliness
              </Text>
            </View>
            <Text style={careTankModalStyles.careTankBarPct}>{progress}%</Text>
          </View>
          <View style={careTankModalStyles.careTankBarTrack}>
            <View
              style={[
                careTankModalStyles.careTankBarFill,
                careTankModalStyles.careTankBarFillClean,
                { width: `${progress}%` },
              ]}
            />
          </View>
          <ImageBackground
            source={require('../AquaAssets/images/aquarium.png')}
            style={careTankModalStyles.careTankAquariumFull}
          >
            <View
              style={careTankModalStyles.careTankAquariumTapArea}
              {...careTankPan.panHandlers}
            >
              <SwimmingFishModal index={0} onPress={() => {}} />
              <SwimmingFishModal index={1} onPress={() => {}} />
              <SwimmingFishModal index={2} onPress={() => {}} />
              <View
                style={[
                  careTankModalStyles.careTankCleanOverlay,
                  { opacity: careTankOverlayOpacity },
                ]}
                pointerEvents="none"
              />
            </View>
          </ImageBackground>
          <Pressable
            style={careTankModalStyles.careTankCancelBtn}
            onPress={onCancel}
          >
            <Text style={careTankModalStyles.careTankCancelText}>Cancel</Text>
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
  const [careTankFoodSpots, setCareTankFoodSpots] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  const careTankHandleFeedTap = (e: {
    nativeEvent: { locationX: number; locationY: number };
  }) => {
    const { locationX: careTankLocationX, locationY: careTankLocationY } =
      e.nativeEvent;
    const careTankId = Date.now();
    setCareTankFoodSpots(prev => [
      ...prev,
      { id: careTankId, x: careTankLocationX, y: careTankLocationY },
    ]);
    onProgress(10);
    setTimeout(() => {
      setCareTankFoodSpots(prev => prev.filter(f => f.id !== careTankId));
    }, 2000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={careTankModalStyles.careTankOverlay}>
        <View style={careTankModalStyles.careTankCard}>
          <Text style={careTankModalStyles.careTankTitle}>
            Tap to Feed the Tank
          </Text>
          <Text style={careTankModalStyles.careTankInstruction}>
            Tap anywhere in the water to drop food — watch the fish gather and
            eat
          </Text>
          <View style={careTankModalStyles.careTankBarRow}>
            <View
              style={[
                careTankModalStyles.careTankBarLabel,
                careTankModalStyles.careTankBarLabelSatiety,
              ]}
            >
              <Text style={careTankModalStyles.careTankBarLabelText}>
                Satiety
              </Text>
            </View>
            <Text style={careTankModalStyles.careTankBarPct}>{progress}%</Text>
          </View>
          <View style={careTankModalStyles.careTankBarTrack}>
            <View
              style={[
                careTankModalStyles.careTankBarFill,
                careTankModalStyles.careTankBarFillSatiety,
                { width: `${progress}%` },
              ]}
            />
          </View>
          <ImageBackground
            source={require('../AquaAssets/images/aquarium.png')}
            style={careTankModalStyles.careTankAquariumFull}
          >
            <View
              style={careTankModalStyles.careTankAquariumTapArea}
              onStartShouldSetResponder={() => true}
              onResponderGrant={careTankHandleFeedTap}
            >
              <SwimmingFishModal index={0} onPress={() => {}} />
              <SwimmingFishModal index={1} onPress={() => {}} />
              <SwimmingFishModal index={2} onPress={() => {}} />
              {careTankFoodSpots.map(careTankFoodSpot => (
                <Image
                  source={require('../AquaAssets/images/feed.png')}
                  key={careTankFoodSpot.id}
                  style={[
                    careTankModalStyles.careTankFoodSpot,
                    {
                      left: careTankFoodSpot.x - 10,
                      top: careTankFoodSpot.y - 10,
                    },
                  ]}
                />
              ))}
            </View>
          </ImageBackground>
          <Pressable
            style={careTankModalStyles.careTankCancelBtn}
            onPress={onCancel}
          >
            <Text style={careTankModalStyles.careTankCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  careTankContainer: {
    flex: 1,
    backgroundColor: '#011D5A',
  },
  careTankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    zIndex: 1,
  },
  careTankTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  careTankSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  careTankBadge: {
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
  careTankBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  careTankHeaderRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  careTankTermsOfUseBtn: {
    backgroundColor: '#040523',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  careTankTermsOfUseBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  careTankSettingsBtn: {
    width: 48,
    height: 48,
    borderRadius: 52,
    backgroundColor: '#040523',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careTankSettingsBtnIcon: {
    width: 24,
    height: 24,
  },

  careTankAquariumWrap: {
    height: 420,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  careTankAquariumBg: {
    width: '100%',
    height: '100%',
  },
  careTankSwimArea: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    paddingTop: 50,
  },
  careTankSwimmingFish: {
    position: 'absolute',
    left: 0,
    top: (careTankAquariumHeight - careTankSwimFishHeight) / 2,
    width: careTankSwimFishWidth,
    height: careTankSwimFishHeight,
  },
  careTankDecorRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  careTankDecorInTank: {
    width: 44,
    height: 44,
    marginVertical: 4,
  },
  careTankFishCardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  careTankBars: {
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  careTankBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  careTankBarLabel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 90,
  },
  careTankBarLabelMood: { backgroundColor: '#02AD58' },
  careTankBarLabelClean: { backgroundColor: '#45ACEC' },
  careTankBarLabelSatiety: { backgroundColor: '#FF8A8A' },
  careTankBarLabelText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  careTankBarTrack: {
    width: '100%' as const,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  careTankBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  careTankBarFillMood: { backgroundColor: '#02AD58' },
  careTankBarFillClean: { backgroundColor: '#45ACEC' },
  careTankBarFillSatiety: { backgroundColor: '#FF8A8A' },
  careTankBarPct: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    width: 46,
    textAlign: 'right',
  },
  careTankSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  careTankFishCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    width: '30%',
  },
  careTankFishIcon: {
    marginBottom: 8,
    width: 64,
    height: 44,
  },
  careTankFishName: {
    color: '#fff',
    fontSize: 16,
  },
  careTankActions: {
    flexDirection: 'row',
    gap: 12,
  },
  careTankBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  careTankBtnPlay: { backgroundColor: '#02AD58' },
  careTankBtnClean: { backgroundColor: '#45ACEC' },
  careTankBtnFeed: { backgroundColor: '#FF8A8A' },
  careTankBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

const careTankModalStyles = StyleSheet.create({
  careTankOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  careTankCard: {
    backgroundColor: '#191936',
    borderRadius: 20,
    padding: 24,
    maxHeight: '85%',
  },
  careTankTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  careTankInstruction: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  careTankBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  careTankBarLabel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  careTankBarLabelMood: { backgroundColor: '#02AD58' },
  careTankBarLabelClean: { backgroundColor: '#45ACEC' },
  careTankBarLabelSatiety: { backgroundColor: '#FF8A8A' },
  careTankBarLabelText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  careTankBarTrack: {
    width: '100%' as const,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
    marginTop: 4,
  },
  careTankBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  careTankBarFillMood: { backgroundColor: '#02AD58' },
  careTankBarFillClean: { backgroundColor: '#45ACEC' },
  careTankBarFillSatiety: { backgroundColor: '#FF8A8A' },
  careTankBarPct: {
    color: '#fff',
    fontSize: 13,
    width: 32,
    textAlign: 'right',
  },
  careTankArea: {
    height: careTankModalAreaHeight,
    borderRadius: 12,
    marginBottom: 16,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  careTankAquariumFull: {
    width: '100%' as const,
    height: 334,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  careTankAquariumTapArea: {
    flex: 1,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  careTankCleanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  careTankFoodSpot: {
    position: 'absolute' as const,
    width: 20,
    height: 20,
    opacity: 0.95,
  },
  careTankWipeHint: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(90,180,220,0.4)',
  },
  careTankCancelBtn: {
    backgroundColor: '#011D5A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  careTankCancelText: { color: '#fff', fontSize: 16, fontWeight: '400' },
});
