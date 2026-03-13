// FishCollectionScreen

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

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

const careTankTasksStorageKey = 'AQUA_TANK_TASKS_V1';
export const COLLECTION_STORAGE_KEY = 'AQUA_COLLECTION_V1';

type CollectionTab = 'fish' | 'decor';

type CollectionItem = {
  id: string;
  name: string;
  price: number;
  image: ImageSourcePropType;
};

type TankTasksState = { points: number; completed?: Record<string, boolean> };
type CollectionState = { unlocked: string[]; inAquarium: string[] };

const careTankFishList: CollectionItem[] = [
  {
    id: 'fish1',
    name: 'Bubbles',
    price: 0,
    image: require('../AquaAssets/images/fish8.png'),
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
];

const careTankDecorList: CollectionItem[] = [
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

const careTankDefaultCollection: CollectionState = {
  unlocked: ['fish1', 'fish2'],
  inAquarium: ['fish1', 'fish2'],
};

export function getCollectionItemById(id: string): {
  id: string;
  name: string;
  image: ImageSourcePropType;
  type: 'fish' | 'decor';
} | null {
  const careTankFish = careTankFishList.find(i => i.id === id);
  if (careTankFish) {
    return {
      id: careTankFish.id,
      name: careTankFish.name,
      image: careTankFish.image,
      type: 'fish',
    };
  }

  const careTankDecor = careTankDecorList.find(i => i.id === id);
  if (careTankDecor) {
    return {
      id: careTankDecor.id,
      name: careTankDecor.name,
      image: careTankDecor.image,
      type: 'decor',
    };
  }

  return null;
}

export default function FishCollectionScreen() {
  const careTankInsets = useSafeAreaInsets();
  const [careTankPoints, setCareTankPoints] = useState(0);
  const [careTankUnlocked, setCareTankUnlocked] = useState<string[]>([]);
  const [careTankInAquarium, setCareTankInAquarium] = useState<string[]>([]);
  const [careTankTab, setCareTankTab] = useState<CollectionTab>('fish');
  const [careTankNotEnoughPointsAlert, setCareTankNotEnoughPointsAlert] =
    useState(false);
  const [careTankShowTermsOfUse, setCareTankShowTermsOfUse] = useState(false);
  const careTankTermsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const careTankLoadPoints = async () => {
    try {
      const careTankRaw = await AsyncStorage.getItem(careTankTasksStorageKey);
      if (!careTankRaw) return;
      const careTankData = JSON.parse(careTankRaw) as TankTasksState;
      setCareTankPoints(careTankData.points ?? 0);
    } catch {
      setCareTankPoints(0);
    }
  };

  const careTankLoadCollection = async () => {
    try {
      const careTankRaw = await AsyncStorage.getItem(COLLECTION_STORAGE_KEY);
      if (!careTankRaw) {
        setCareTankUnlocked(careTankDefaultCollection.unlocked);
        setCareTankInAquarium(careTankDefaultCollection.inAquarium);
        await AsyncStorage.setItem(
          COLLECTION_STORAGE_KEY,
          JSON.stringify(careTankDefaultCollection),
        );
        return;
      }
      const careTankData = JSON.parse(careTankRaw) as CollectionState;
      const careTankDecorIds = new Set(careTankDecorList.map(item => item.id));
      const careTankUnlockedWithoutDecor = (
        careTankData.unlocked ?? careTankDefaultCollection.unlocked
      ).filter(id => !careTankDecorIds.has(id));
      const careTankInAquariumWithoutDecor = (
        careTankData.inAquarium ?? careTankDefaultCollection.inAquarium
      ).filter(id => !careTankDecorIds.has(id));
      const careTankCollectionWithDefaultFish: CollectionState = {
        unlocked: [...new Set([...careTankUnlockedWithoutDecor, 'fish2'])],
        inAquarium: [...new Set([...careTankInAquariumWithoutDecor, 'fish2'])],
      };
      setCareTankUnlocked(careTankCollectionWithDefaultFish.unlocked);
      setCareTankInAquarium(careTankCollectionWithDefaultFish.inAquarium);
      await AsyncStorage.setItem(
        COLLECTION_STORAGE_KEY,
        JSON.stringify(careTankCollectionWithDefaultFish),
      );
    } catch {
      setCareTankUnlocked(careTankDefaultCollection.unlocked);
      setCareTankInAquarium(careTankDefaultCollection.inAquarium);
    }
  };

  useFocusEffect(
    useCallback(() => {
      careTankLoadPoints();
      careTankLoadCollection();
    }, []),
  );

  useEffect(() => {
    return () => {
      if (careTankTermsTimeoutRef.current) {
        clearTimeout(careTankTermsTimeoutRef.current);
      }
    };
  }, []);

  const careTankPersistCollection = async (next: CollectionState) => {
    setCareTankUnlocked(next.unlocked);
    setCareTankInAquarium(next.inAquarium);
    try {
      await AsyncStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const careTankDeductPoints = async (amount: number) => {
    const careTankNewPoints = Math.max(0, careTankPoints - amount);
    setCareTankPoints(careTankNewPoints);
    try {
      const careTankRaw = await AsyncStorage.getItem(careTankTasksStorageKey);
      const careTankData = careTankRaw
        ? (JSON.parse(careTankRaw) as TankTasksState)
        : { points: 0, completed: {} };
      await AsyncStorage.setItem(
        careTankTasksStorageKey,
        JSON.stringify({ ...careTankData, points: careTankNewPoints }),
      );
    } catch {}
  };

  const careTankHandleUnlock = async (item: CollectionItem) => {
    if (careTankPoints < item.price) {
      setCareTankNotEnoughPointsAlert(true);
      setTimeout(() => setCareTankNotEnoughPointsAlert(false), 2500);
      return;
    }
    await careTankDeductPoints(item.price);
    const careTankNextUnlocked = [...new Set([...careTankUnlocked, item.id])];
    await careTankPersistCollection({
      unlocked: careTankNextUnlocked,
      inAquarium: careTankInAquarium,
    });
  };

  const careTankHandleAddToAquarium = async (item: CollectionItem) => {
    if (!careTankUnlocked.includes(item.id)) return;
    const careTankNextInAquarium = [
      ...new Set([...careTankInAquarium, item.id]),
    ];
    await careTankPersistCollection({
      unlocked: careTankUnlocked,
      inAquarium: careTankNextInAquarium,
    });
  };

  const careTankItems =
    careTankTab === 'fish' ? careTankFishList : careTankDecorList;

  const careTankGetButtonState = (item: CollectionItem) => {
    const careTankIsUnlocked = careTankUnlocked.includes(item.id);
    const careTankIsInAquarium = careTankInAquarium.includes(item.id);
    if (!careTankIsUnlocked) return 'unlock';
    if (careTankIsInAquarium) return 'in_aquarium';
    return 'add_to_aquarium';
  };

  return (
    <View style={styles.careTankContainer}>
      {careTankNotEnoughPointsAlert && (
        <View style={styles.careTankToast} pointerEvents="none">
          <Text style={styles.careTankToastText}>
            Not enough points to unlock
          </Text>
        </View>
      )}
      <ScrollView
        contentContainerStyle={[
          styles.careTankScrollContent,
          { paddingTop: careTankInsets.top + 8 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.careTankHeader}>
          <View style={styles.careTankHeaderLeft}>
            <Text style={styles.careTankTitle}>Fish Collection</Text>
            <Text style={styles.careTankSubtitle}>
              Spend points to unlock new fish and decor for your tank
            </Text>
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

        <View style={styles.careTankTabs}>
          <Pressable
            style={[
              styles.careTankTab,
              careTankTab === 'fish' && styles.careTankTabActive,
            ]}
            onPress={() => setCareTankTab('fish')}
          >
            <Text style={styles.careTankTabText}>Fish</Text>
          </Pressable>
          <Pressable
            style={[
              styles.careTankTab,
              careTankTab === 'decor' && styles.careTankTabActive,
            ]}
            onPress={() => setCareTankTab('decor')}
          >
            <Text style={styles.careTankTabText}>Decor</Text>
          </Pressable>
        </View>

        <View style={styles.careTankGrid}>
          {careTankItems.map(item => {
            const careTankState = careTankGetButtonState(item);
            return (
              <View key={item.id} style={styles.careTankCardWrap}>
                <View style={styles.careTankCard}>
                  <View style={styles.careTankCardImageWrap}>
                    <Image
                      source={item.image}
                      style={styles.careTankCardImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.careTankCardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.careTankPriceBadge}>
                    <Image
                      source={require('../AquaAssets/images/points.png')}
                      style={styles.careTankPriceIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.careTankPriceText}>{item.price}</Text>
                  </View>
                </View>
                {careTankState === 'unlock' && (
                  <Pressable
                    style={styles.careTankBtnUnlock}
                    onPress={() => careTankHandleUnlock(item)}
                  >
                    <Text style={styles.careTankBtnText}>Unlock</Text>
                  </Pressable>
                )}
                {careTankState === 'add_to_aquarium' && (
                  <Pressable
                    style={styles.careTankBtnAdd}
                    onPress={() => careTankHandleAddToAquarium(item)}
                  >
                    <Text style={styles.careTankBtnText}>Add to Aquarium</Text>
                  </Pressable>
                )}
                {careTankState === 'in_aquarium' && (
                  <View style={styles.careTankBtnInAquarium}>
                    <Text style={styles.careTankBtnText}>In Aquarium</Text>
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
  careTankContainer: {
    flex: 1,
    backgroundColor: '#011D5A',
  },
  careTankScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  careTankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  careTankHeaderLeft: {
    flex: 1,
  },
  careTankHeaderRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
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
    width: '90%',
  },
  careTankPointsBadge: {
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
  careTankPointsIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  careTankPointsText: {
    color: '#854E00',
    fontSize: 16,
    fontWeight: '600',
  },
  careTankSettingsBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#040523',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careTankSettingsBtnIcon: {
    width: 24,
    height: 24,
  },
  careTankTermsOfUseBtn: {
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
  careTankTermsOfUseBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  careTankToast: {
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
  careTankToastText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  careTankTabs: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  careTankTab: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: '#040523',
    minHeight: 40,
  },
  careTankTabActive: {
    backgroundColor: '#60B6ED',
  },
  careTankTabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  careTankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  careTankCardWrap: {
    width: '47%',
    alignItems: 'stretch',
  },
  careTankCard: {
    backgroundColor: '#183173',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  careTankCardImageWrap: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  careTankCardImage: {
    width: '80%',
    height: '80%',
  },
  careTankCardName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    width: '100%',
    textAlign: 'center',
  },
  careTankPriceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FF9600',
  },
  careTankPriceIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  careTankPriceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  careTankBtnUnlock: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FF9600',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careTankBtnAdd: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#040523',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careTankBtnInAquarium: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#040523',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careTankBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
