// TankTasksScreen

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const careTankTasksStorageKey = 'AQUA_TANK_TASKS_V1';

type TaskId = 'clean' | 'feed' | 'play';

type Task = {
  id: TaskId;
  title: string;
  points: number;
};

type StoredState = {
  points: number;
  completed: Record<TaskId, boolean>;
};

const careTankTasks: Task[] = [
  { id: 'clean', title: 'Clean the tank', points: 15 },
  { id: 'feed', title: 'Feed the fish', points: 10 },
  { id: 'play', title: 'Play with fish', points: 10 },
];

const careTankDefaultState: StoredState = {
  points: 0,
  completed: { clean: false, feed: false, play: false },
};

export default function TankTasksScreen() {
  const careTankInsets = useSafeAreaInsets();
  const careTankNavigation = useNavigation();
  const [careTankPoints, setCareTankPoints] = useState(0);
  const [careTankCompleted, setCareTankCompleted] = useState<
    Record<TaskId, boolean>
  >(careTankDefaultState.completed);
  const [careTankShowTermsOfUse, setCareTankShowTermsOfUse] = useState(false);
  const careTankTermsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const careTankLoad = async () => {
    try {
      const careTankRaw = await AsyncStorage.getItem(careTankTasksStorageKey);
      if (!careTankRaw) return;
      const careTankData = JSON.parse(careTankRaw) as StoredState;
      setCareTankPoints(careTankData.points ?? 0);
      setCareTankCompleted({
        ...careTankDefaultState.completed,
        ...(careTankData.completed || {}),
      });
    } catch {
      setCareTankPoints(careTankDefaultState.points);
      setCareTankCompleted(careTankDefaultState.completed);
    }
  };

  useFocusEffect(
    useCallback(() => {
      careTankLoad();
    }, []),
  );

  useEffect(() => {
    return () => {
      if (careTankTermsTimeoutRef.current) {
        clearTimeout(careTankTermsTimeoutRef.current);
      }
    };
  }, []);

  const careTankPersist = async (next: StoredState) => {
    setCareTankPoints(next.points);
    setCareTankCompleted(next.completed);
    try {
      await AsyncStorage.setItem(careTankTasksStorageKey, JSON.stringify(next));
    } catch {}
  };

  const careTankToggleTask = (id: TaskId, taskPoints: number) => {
    const careTankIsCompleted = careTankCompleted[id];
    if (careTankIsCompleted) return;
    const careTankNextCompleted = { ...careTankCompleted, [id]: true };
    const careTankNextPoints = careTankPoints + taskPoints;
    careTankPersist({
      points: careTankNextPoints,
      completed: careTankNextCompleted,
    });
  };

  return (
    <View style={[styles.careTankContainer]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: careTankInsets.top,
          paddingBottom: 100,
        }}
      >
        <View style={styles.careTankHeader}>
          <View>
            <View>
              <Text style={styles.careTankTitle}>Tank Tasks</Text>
              <Text style={styles.careTankSubtitle}>
                Simple daily care keeps the aquarium balanced
              </Text>
            </View>
            <View style={styles.careTankPointsBadge}>
              <Image
                source={require('../AquaAssets/images/points.png')}
                style={styles.careTankPointsIcon}
                resizeMode="contain"
              />
              <Text style={styles.careTankPointsText}>{careTankPoints}</Text>
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
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
            {careTankShowTermsOfUse && (
              <Pressable
                style={styles.careTankTermsOfUseBtn}
                onPress={() =>
                  Linking.openURL(
                    'https://www.termsfeed.com/live/95958dbe-1f11-40bf-8198-ad9a174d6f95',
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

        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {careTankTasks.map(careTankTask => {
            const careTankIsCompleted = careTankCompleted[careTankTask.id];
            return (
              <Pressable
                key={careTankTask.id}
                style={[
                  styles.careTankTaskCard,
                  careTankIsCompleted && styles.careTankTaskCardCompleted,
                ]}
                onPress={() =>
                  careTankToggleTask(careTankTask.id, careTankTask.points)
                }
              >
                <View style={{ gap: 8 }}>
                  <Text style={styles.careTankTaskTitle}>
                    {careTankTask.title}
                  </Text>
                  <View style={styles.careTankTaskPointsBadge}>
                    <Image
                      source={require('../AquaAssets/images/points.png')}
                      style={styles.careTankTaskPointsIcon}
                    />
                    <Text style={styles.careTankTaskPointsText}>
                      {careTankTask.points}
                    </Text>
                  </View>
                </View>
                <View style={[styles.careTankCheckCircle]}>
                  {careTankIsCompleted ? (
                    <Image
                      source={require('../AquaAssets/images/checked.png')}
                    />
                  ) : (
                    <Image source={require('../AquaAssets/images/empt.png')} />
                  )}
                </View>
              </Pressable>
            );
          })}

          <Text style={styles.careTankSectionTitle}>Play Corner</Text>
          <Pressable
            style={styles.careTankPlayCard}
            onPress={() =>
              careTankNavigation.navigate('HueStreamScreen' as never)
            }
          >
            <Image
              source={require('../AquaAssets/images/huegame.png')}
              style={{ marginRight: 8 }}
            />
            <View style={styles.careTankPlayCardContent}>
              <Text style={styles.careTankPlayCardTitle}>Hue Stream</Text>
              <Text style={styles.careTankPlayCardDesc}>
                Arrange the shades from light to dark
              </Text>
            </View>
            <Image source={require('../AquaAssets/images/play.png')} />
          </Pressable>
          <Pressable
            style={styles.careTankPlayCard}
            onPress={() =>
              careTankNavigation.navigate('BubblePopScreen' as never)
            }
          >
            <Image
              source={require('../AquaAssets/images/bubblegame.png')}
              style={{ marginRight: 8 }}
            />
            <View style={styles.careTankPlayCardContent}>
              <Text style={styles.careTankPlayCardTitle}>Bubble Pop</Text>
              <Text style={styles.careTankPlayCardDesc}>
                Pop bubbles and clear the water
              </Text>
            </View>
            <Image source={require('../AquaAssets/images/play.png')} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  careTankTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  careTankSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    width: '80%',
  },
  careTankPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    height: 30,
    paddingHorizontal: 14,
    minWidth: 70,
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#FF9600',
  },
  careTankPointsIcon: {
    width: 22,
    height: 22,
    marginRight: 6,
  },
  careTankPointsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  careTankHeaderRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  careTankTermsOfUseBtn: {
    backgroundColor: '#011D5A',
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
    borderRadius: 22,
    backgroundColor: '#040523',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careTankScroll: {
    flex: 1,
  },
  careTankScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  careTankTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#183173',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 16,
    justifyContent: 'space-between',
  },
  careTankTaskCardCompleted: {
    borderColor: '#02AD58',
  },
  careTankTaskTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '400',
  },
  careTankTaskPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#FF9600',
    marginRight: 12,
    minWidth: 65,
    justifyContent: 'center',
  },
  careTankTaskPointsIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  careTankTaskPointsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  careTankCheckCircle: {},
  careTankCheckCircleDone: {
    backgroundColor: '#02AD58',
  },
  careTankCheckmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  careTankSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 24,
    marginBottom: 8,
  },
  careTankPlayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
  },
  careTankPlayCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginRight: 12,
  },
  careTankPlayCardContent: {
    flex: 1,
  },
  careTankPlayCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  careTankPlayCardDesc: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    marginTop: 2,
    width: '90%',
  },
  careTankPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF9600',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careTankPlayButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
