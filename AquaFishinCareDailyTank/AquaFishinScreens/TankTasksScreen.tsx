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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const TANK_TASKS_STORAGE_KEY = 'AQUA_TANK_TASKS_V1';

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

const TASKS: Task[] = [
  { id: 'clean', title: 'Clean the tank', points: 15 },
  { id: 'feed', title: 'Feed the fish', points: 10 },
  { id: 'play', title: 'Play with fish', points: 10 },
];

const defaultState: StoredState = {
  points: 0,
  completed: { clean: false, feed: false, play: false },
};

export default function TankTasksScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [points, setPoints] = useState(0);
  const [completed, setCompleted] = useState<Record<TaskId, boolean>>(
    defaultState.completed,
  );
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);
  const termsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(TANK_TASKS_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as StoredState;
      setPoints(data.points ?? 0);
      setCompleted({
        ...defaultState.completed,
        ...(data.completed || {}),
      });
    } catch {
      setPoints(defaultState.points);
      setCompleted(defaultState.completed);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    return () => {
      if (termsTimeoutRef.current) clearTimeout(termsTimeoutRef.current);
    };
  }, []);

  const persist = useCallback(async (next: StoredState) => {
    setPoints(next.points);
    setCompleted(next.completed);
    try {
      await AsyncStorage.setItem(TANK_TASKS_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const toggleTask = useCallback(
    (id: TaskId, taskPoints: number) => {
      const isCompleted = completed[id];
      if (isCompleted) return;
      const nextCompleted = { ...completed, [id]: true };
      const nextPoints = points + taskPoints;
      persist({ points: nextPoints, completed: nextCompleted });
    },
    [completed, points, persist],
  );

  return (
    <View style={[styles.container]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 100 }}
      >
        <View style={styles.header}>
          <View>
            <View>
              <Text style={styles.title}>Tank Tasks</Text>
              <Text style={styles.subtitle}>
                Simple daily care keeps the aquarium balanced
              </Text>
            </View>
            <View style={styles.pointsBadge}>
              <Image
                source={require('../AquaAssets/images/points.png')}
                style={styles.pointsIcon}
                resizeMode="contain"
              />
              <Text style={styles.pointsText}>{points}</Text>
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
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {TASKS.map(task => {
            const isCompleted = completed[task.id];
            return (
              <Pressable
                key={task.id}
                style={[
                  styles.taskCard,
                  isCompleted && styles.taskCardCompleted,
                ]}
                onPress={() => toggleTask(task.id, task.points)}
              >
                <View style={{ gap: 8 }}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={styles.taskPointsBadge}>
                    <Image
                      source={require('../AquaAssets/images/points.png')}
                      style={styles.taskPointsIcon}
                    />
                    <Text style={styles.taskPointsText}>{task.points}</Text>
                  </View>
                </View>
                <View style={[styles.checkCircle]}>
                  {isCompleted ? (
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

          <Text style={styles.sectionTitle}>Play Corner</Text>
          <Pressable
            style={styles.playCard}
            onPress={() => navigation.navigate('HueStreamScreen' as never)}
          >
            <Image
              source={require('../AquaAssets/images/huegame.png')}
              style={{ marginRight: 8 }}
            />
            <View style={styles.playCardContent}>
              <Text style={styles.playCardTitle}>Hue Stream</Text>
              <Text style={styles.playCardDesc}>
                Arrange the shades from light to dark
              </Text>
            </View>
            <Image source={require('../AquaAssets/images/play.png')} />
          </Pressable>
          <Pressable
            style={styles.playCard}
            onPress={() => navigation.navigate('BubblePopScreen' as never)}
          >
            <Image
              source={require('../AquaAssets/images/bubblegame.png')}
              style={{ marginRight: 8 }}
            />
            <View style={styles.playCardContent}>
              <Text style={styles.playCardTitle}>Bubble Pop</Text>
              <Text style={styles.playCardDesc}>
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
  container: {
    flex: 1,
    backgroundColor: '#011D5A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    width: '80%',
  },
  pointsBadge: {
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
  pointsIcon: {
    width: 22,
    height: 22,
    marginRight: 6,
  },
  pointsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  termsOfUseBtn: {
    backgroundColor: '#011D5A',
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
    borderRadius: 22,
    backgroundColor: '#040523',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#183173',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 16,
    justifyContent: 'space-between',
  },
  taskCardCompleted: {
    borderColor: '#02AD58',
  },
  taskTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '400',
  },
  taskPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#FF9600',
    marginRight: 12,
    minWidth: 65,
    justifyContent: 'center',
  },
  taskPointsIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  taskPointsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkCircle: {},
  checkCircleDone: {
    backgroundColor: '#02AD58',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 24,
    marginBottom: 8,
  },
  playCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
  },
  playCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginRight: 12,
  },
  playCardContent: {
    flex: 1,
  },
  playCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  playCardDesc: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    marginTop: 2,
    width: '90%',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF9600',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
