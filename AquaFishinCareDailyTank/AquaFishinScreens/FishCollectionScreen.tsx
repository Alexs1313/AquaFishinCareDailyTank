import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  TouchableOpacity,
  ImageSourcePropType,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const TANK_TASKS_STORAGE_KEY = 'AQUA_TANK_TASKS_V1';
export const COLLECTION_STORAGE_KEY = 'AQUA_COLLECTION_V1';

type CollectionTab = 'fish' | 'decor';

type CollectionItem = {
  id: string;
  name: string;
  price: number;
  image: ImageSourcePropType;
};

// Очки из Tank Tasks; разблокированные id и id «в аквариуме» — отдельное хранилище
type TankTasksState = { points: number; completed?: Record<string, boolean> };
type CollectionState = { unlocked: string[]; inAquarium: string[] };

// Плейсхолдеры: можно заменить на свои картинки (например collection/fish1.png … fish8.png, decor1.png … decor8.png)
const FISH_LIST: CollectionItem[] = [
  {
    id: 'fish1',
    name: 'Bubbles',
    price: 0,
    image: require('../AquaAssets/images/fish.png'),
  },
  {
    id: 'fish2',
    name: 'Coral',
    price: 30,
    image: require('../AquaAssets/images/fish2.png'),
  },
  {
    id: 'fish3',
    name: 'Mossy',
    price: 30,
    image: require('../AquaAssets/images/fish3.png'),
  },
  {
    id: 'fish4',
    name: 'Sunny',
    price: 45,
    image: require('../AquaAssets/images/fish4.png'),
  },
  {
    id: 'fish5',
    name: 'Lagoon',
    price: 45,
    image: require('../AquaAssets/images/fish5.png'),
  },
  {
    id: 'fish6',
    name: 'Ember',
    price: 50,
    image: require('../AquaAssets/images/fish6.png'),
  },
  {
    id: 'fish7',
    name: 'Ripple',
    price: 50,
    image: require('../AquaAssets/images/fish7.png'),
  },
  {
    id: 'fish8',
    name: 'Nemoa',
    price: 60,
    image: require('../AquaAssets/images/fish8.png'),
  },
];

const DECOR_LIST: CollectionItem[] = [
  {
    id: 'decor1',
    name: 'Sunken Tower',
    price: 100,
    image: require('../AquaAssets/images/decor1.png'),
  },
  {
    id: 'decor2',
    name: 'Sand Castle',
    price: 100,
    image: require('../AquaAssets/images/decor2.png'),
  },
  {
    id: 'decor3',
    name: 'Green Sprigs',
    price: 50,
    image: require('../AquaAssets/images/decor3.png'),
  },
  {
    id: 'decor4',
    name: 'Rose Coral',
    price: 45,
    image: require('../AquaAssets/images/decor4.png'),
  },
  {
    id: 'decor5',
    name: 'Crimson Bloom',
    price: 50,
    image: require('../AquaAssets/images/decor5.png'),
  },
  {
    id: 'decor6',
    name: 'Sea Grass',
    price: 45,
    image: require('../AquaAssets/images/decor6.png'),
  },
  {
    id: 'decor7',
    name: 'Pink Branch',
    price: 30,
    image: require('../AquaAssets/images/decor7.png'),
  },
  {
    id: 'decor8',
    name: 'Violet Tubes',
    price: 30,
    image: require('../AquaAssets/images/decor8.png'),
  },
];

const defaultCollection: CollectionState = {
  unlocked: ['fish1'],
  inAquarium: ['fish1'],
};

export function getCollectionItemById(id: string): {
  id: string;
  name: string;
  image: ImageSourcePropType;
  type: 'fish' | 'decor';
} | null {
  const f = FISH_LIST.find(i => i.id === id);
  if (f) return { id: f.id, name: f.name, image: f.image, type: 'fish' };
  const d = DECOR_LIST.find(i => i.id === id);
  if (d) return { id: d.id, name: d.name, image: d.image, type: 'decor' };
  return null;
}

export default function FishCollectionScreen() {
  const insets = useSafeAreaInsets();
  const [points, setPoints] = useState(0);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [inAquarium, setInAquarium] = useState<string[]>([]);
  const [tab, setTab] = useState<CollectionTab>('fish');
  const [notEnoughPointsAlert, setNotEnoughPointsAlert] = useState(false);
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);
  const termsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPoints = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(TANK_TASKS_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as TankTasksState;
      setPoints(data.points ?? 0);
    } catch {
      setPoints(0);
    }
  }, []);

  const loadCollection = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(COLLECTION_STORAGE_KEY);
      if (!raw) {
        setUnlocked(defaultCollection.unlocked);
        setInAquarium(defaultCollection.inAquarium);
        await AsyncStorage.setItem(
          COLLECTION_STORAGE_KEY,
          JSON.stringify(defaultCollection),
        );
        return;
      }
      const data = JSON.parse(raw) as CollectionState;
      setUnlocked(data.unlocked ?? defaultCollection.unlocked);
      setInAquarium(data.inAquarium ?? defaultCollection.inAquarium);
    } catch {
      setUnlocked(defaultCollection.unlocked);
      setInAquarium(defaultCollection.inAquarium);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPoints();
      loadCollection();
    }, [loadPoints, loadCollection]),
  );

  useEffect(() => {
    return () => {
      if (termsTimeoutRef.current) clearTimeout(termsTimeoutRef.current);
    };
  }, []);

  const persistCollection = useCallback(async (next: CollectionState) => {
    setUnlocked(next.unlocked);
    setInAquarium(next.inAquarium);
    try {
      await AsyncStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const deductPoints = useCallback(
    async (amount: number) => {
      const newPoints = Math.max(0, points - amount);
      setPoints(newPoints);
      try {
        const raw = await AsyncStorage.getItem(TANK_TASKS_STORAGE_KEY);
        const data = raw
          ? (JSON.parse(raw) as TankTasksState)
          : { points: 0, completed: {} };
        await AsyncStorage.setItem(
          TANK_TASKS_STORAGE_KEY,
          JSON.stringify({ ...data, points: newPoints }),
        );
      } catch {}
    },
    [points],
  );

  const handleUnlock = useCallback(
    async (item: CollectionItem) => {
      if (points < item.price) {
        setNotEnoughPointsAlert(true);
        setTimeout(() => setNotEnoughPointsAlert(false), 2500);
        return;
      }
      await deductPoints(item.price);
      const nextUnlocked = [...new Set([...unlocked, item.id])];
      await persistCollection({ unlocked: nextUnlocked, inAquarium });
    },
    [points, unlocked, inAquarium, deductPoints, persistCollection],
  );

  const handleAddToAquarium = useCallback(
    async (item: CollectionItem) => {
      if (!unlocked.includes(item.id)) return;
      const nextInAquarium = [...new Set([...inAquarium, item.id])];
      await persistCollection({ unlocked, inAquarium: nextInAquarium });
    },
    [unlocked, inAquarium, persistCollection],
  );

  const items = tab === 'fish' ? FISH_LIST : DECOR_LIST;

  const getButtonState = (item: CollectionItem) => {
    const isUnlocked = unlocked.includes(item.id);
    const isInAquarium = inAquarium.includes(item.id);
    if (!isUnlocked) return 'unlock';
    if (isInAquarium) return 'in_aquarium';
    return 'add_to_aquarium';
  };

  return (
    <View style={styles.container}>
      {notEnoughPointsAlert && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>Not enough points to unlock</Text>
        </View>
      )}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 8 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Fish Collection</Text>
            <Text style={styles.subtitle}>
              Spend points to unlock new fish and decor for your tank
            </Text>
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

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'fish' && styles.tabActive]}
            onPress={() => setTab('fish')}
          >
            <Text style={styles.tabText}>Fish</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'decor' && styles.tabActive]}
            onPress={() => setTab('decor')}
          >
            <Text style={styles.tabText}>Decor</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {items.map(item => {
            const state = getButtonState(item);
            return (
              <View key={item.id} style={styles.cardWrap}>
                <View style={styles.card}>
                  <View style={styles.cardImageWrap}>
                    <Image
                      source={item.image}
                      style={styles.cardImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.priceBadge}>
                    <Image
                      source={require('../AquaAssets/images/points.png')}
                      style={styles.priceIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.priceText}>{item.price}</Text>
                  </View>
                </View>
                {state === 'unlock' && (
                  <Pressable
                    style={styles.btnUnlock}
                    onPress={() => handleUnlock(item)}
                  >
                    <Text style={styles.btnText}>Unlock</Text>
                  </Pressable>
                )}
                {state === 'add_to_aquarium' && (
                  <Pressable
                    style={styles.btnAdd}
                    onPress={() => handleAddToAquarium(item)}
                  >
                    <Text style={styles.btnText}>Add to Aquarium</Text>
                  </Pressable>
                )}
                {state === 'in_aquarium' && (
                  <View style={styles.btnInAquarium}>
                    <Text style={styles.btnText}>In Aquarium</Text>
                  </View>
                )}
              </View>
            );
          })}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
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
    width: '90%',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    height: 36,
    paddingHorizontal: 14,
    minWidth: 70,
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#FF9600',
  },
  pointsIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  pointsText: {
    color: '#854E00',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#040523',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnIcon: {
    width: 24,
    height: 24,
  },
  termsOfUseBtn: {
    backgroundColor: '#040523',
    width: 130,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 50,
    right: 5,
    height: 36,
  },
  termsOfUseBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    backgroundColor: '#C62828',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  toastText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  tab: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: '#040523',
    minHeight: 40,
  },
  tabActive: {
    backgroundColor: '#60B6ED',
  },
  tabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  cardWrap: {
    width: '47%',
    alignItems: 'stretch',
  },
  card: {
    backgroundColor: '#183173',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  cardImageWrap: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: '80%',
    height: '80%',
  },
  cardName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    width: '100%',
    textAlign: 'center',
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FF9600',
  },
  priceIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  priceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnUnlock: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FF9600',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAdd: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#040523',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInAquarium: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#040523',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
