// HueStreamScreen

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import Orientation from 'react-native-orientation-locker';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: careTankScreenWidth } = Dimensions.get('window');
const careTankTasksStorageKey = 'AQUA_TANK_TASKS_V1';
const careTankHuePoints = 15;

const careTankHues: { hex: string }[] = [
  { hex: '#011116' },
  { hex: '#042634' },
  { hex: '#093956' },
  { hex: '#134884' },
  { hex: '#324FBC' },
  { hex: '#6154E2' },
  { hex: '#8E61F1' },
  { hex: '#B971F5' },
  { hex: '#DE86F2' },
  { hex: '#F3A6E6' },
  { hex: '#FCC9E3' },
  { hex: '#FEDAE8' },
  { hex: '#FEEBF0' },
  { hex: '#FFF5F7' },
];

function careTankLuminance(hex: string): number {
  const careTankR = parseInt(hex.slice(1, 3), 16) / 255;
  const careTankG = parseInt(hex.slice(3, 5), 16) / 255;
  const careTankB = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * careTankR + 0.587 * careTankG + 0.114 * careTankB;
}

const careTankSortedByLuminance = [...careTankHues].sort(
  (a, b) => careTankLuminance(a.hex) - careTankLuminance(b.hex),
);
const careTankCorrectOrder = careTankSortedByLuminance.map(h =>
  careTankHues.indexOf(h),
);

function careTankShuffle<T>(arr: T[]): T[] {
  const careTankOut = [...arr];
  for (let careTankI = careTankOut.length - 1; careTankI > 0; careTankI--) {
    const careTankJ = Math.floor(Math.random() * (careTankI + 1));
    [careTankOut[careTankI], careTankOut[careTankJ]] = [
      careTankOut[careTankJ],
      careTankOut[careTankI],
    ];
  }
  return careTankOut;
}

function careTankIsSortedByLuminance(order: number[]): boolean {
  for (let careTankI = 1; careTankI < order.length; careTankI++) {
    if (
      careTankLuminance(careTankHues[order[careTankI]].hex) <
      careTankLuminance(careTankHues[order[careTankI - 1]].hex)
    ) {
      return false;
    }
  }
  return true;
}

export default function HueStreamScreen() {
  const careTankInsets = useSafeAreaInsets();
  const careTankNavigation = useNavigation();
  const [careTankOrder, setCareTankOrder] = useState<number[]>(() =>
    careTankShuffle(careTankCorrectOrder),
  );
  const [careTankSelectedIndex, setCareTankSelectedIndex] = useState<
    number | null
  >(null);
  const [careTankStartTime, setCareTankStartTime] = useState(() => Date.now());
  const [careTankElapsedSec, setCareTankElapsedSec] = useState(0);
  const [careTankCompleted, setCareTankCompleted] = useState(false);
  const [careTankShowLeaveModal, setCareTankShowLeaveModal] = useState(false);
  const [careTankShowSuccessModal, setCareTankShowSuccessModal] =
    useState(false);

  useEffect(() => {
    if (careTankCompleted) return;
    const careTankIntervalId = setInterval(() => {
      setCareTankElapsedSec(
        Math.floor((Date.now() - careTankStartTime) / 1000),
      );
    }, 1000);
    return () => clearInterval(careTankIntervalId);
  }, [careTankCompleted, careTankStartTime]);

  useEffect(() => {
    if (careTankCompleted) return;
    if (careTankIsSortedByLuminance(careTankOrder)) {
      setCareTankCompleted(true);
      setCareTankShowSuccessModal(true);
    }
  }, [careTankOrder, careTankCompleted]);

  const careTankHandleBarPress = (index: number) => {
    setCareTankSelectedIndex(prev => {
      if (prev === null) return index;
      if (prev === index) return null;
      setCareTankOrder(prevOrder => {
        const careTankNext = [...prevOrder];
        [careTankNext[prev], careTankNext[index]] = [
          careTankNext[index],
          careTankNext[prev],
        ];
        return careTankNext;
      });
      return null;
    });
  };

  const careTankTimeStr = useMemo(() => {
    const careTankMinutes = Math.floor(careTankElapsedSec / 60);
    const careTankSeconds = careTankElapsedSec % 60;
    return `${careTankMinutes.toString().padStart(2, '0')}:${careTankSeconds
      .toString()
      .padStart(2, '0')}`;
  }, [careTankElapsedSec]);

  const careTankSaveAndExit = async () => {
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
          points: careTankCurrentPoints + careTankHuePoints,
        }),
      );
    } catch {}
    careTankNavigation.goBack();
  };

  useFocusEffect(
    useCallback(() => {
      Orientation.lockToPortrait();
      return () => {
        Orientation.unlockAllOrientations();
      };
    }, []),
  );

  const careTankPlayAgain = () => {
    setCareTankOrder(careTankShuffle(careTankCorrectOrder));
    setCareTankSelectedIndex(null);
    setCareTankCompleted(false);
    setCareTankShowSuccessModal(false);
    setCareTankStartTime(Date.now());
    setCareTankElapsedSec(0);
  };

  return (
    <View
      style={[styles.careTankContainer, { paddingTop: careTankInsets.top }]}
    >
      <View style={styles.careTankHeader}>
        <View style={styles.careTankTimerBox}>
          <Text style={styles.careTankTimerBoxText}>{careTankTimeStr}</Text>
        </View>
        <Pressable
          style={styles.careTankCloseBtn}
          onPress={() => setCareTankShowLeaveModal(true)}
        >
          <Text style={styles.careTankCloseBtnText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.careTankScroll}
        contentContainerStyle={[
          styles.careTankScrollContent,
          { paddingBottom: careTankInsets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {careTankOrder.map((careTankColorIndex, careTankIndex) => (
          <Pressable
            key={`${careTankIndex}-${careTankColorIndex}`}
            style={[
              styles.careTankBar,
              { backgroundColor: careTankHues[careTankColorIndex].hex },
              careTankSelectedIndex === careTankIndex &&
                styles.careTankBarSelected,
            ]}
            onPress={() => careTankHandleBarPress(careTankIndex)}
          />
        ))}
      </ScrollView>

      <Modal
        visible={careTankShowLeaveModal}
        transparent
        animationType="fade"
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <View style={styles.careTankModalOverlay}>
          <View style={styles.careTankModalCard}>
            <Text style={styles.careTankModalTitle}>Leave Game?</Text>
            <Text style={styles.careTankModalMessage}>
              Unsaved progress will be lost. Continue?
            </Text>
            <View style={styles.careTankModalButtons}>
              <Pressable
                style={styles.careTankModalBtnStay}
                onPress={() => setCareTankShowLeaveModal(false)}
              >
                <Text style={styles.careTankModalBtnText}>Stay</Text>
              </Pressable>
              <Pressable
                style={styles.careTankModalBtnExit}
                onPress={() => careTankNavigation.goBack()}
              >
                <Text style={styles.careTankModalBtnExitText}>Exit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={careTankShowSuccessModal}
        transparent
        animationType="fade"
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <View style={styles.careTankModalOverlay}>
          <View style={styles.careTankModalCard}>
            <Text style={styles.careTankModalTitle}>Smooth flow</Text>
            <Text style={styles.careTankModalMessage}>
              The colors are perfectly balanced
            </Text>
            <Text style={styles.careTankModalTime}>
              Time: {careTankTimeStr}
            </Text>
            <View style={styles.careTankModalPointsBadge}>
              <Image
                source={require('../AquaAssets/images/points.png')}
                style={styles.careTankModalPointsIcon}
                resizeMode="contain"
              />
              <Text style={styles.careTankModalPointsText}>
                {careTankHuePoints}
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
  },
  careTankTimerBox: {
    backgroundColor: '#45ACEC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 72,
    alignItems: 'center',
  },
  careTankTimerBoxText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  careTankCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careTankCloseBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  careTankScroll: {
    flex: 1,
  },
  careTankScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingTop: 8,
  },
  careTankBar: {
    width: careTankScreenWidth - 32,
    height: 44,
    borderRadius: 12,
  },
  careTankBarSelected: {
    borderWidth: 3,
    borderColor: '#FF9600',
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
    paddingHorizontal: 15,
    width: '100%',
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
  careTankModalTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginBottom: 16,
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
  careTankModalBtnStay: {
    flex: 1,
    backgroundColor: '#011D5A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  careTankModalBtnBack: {
    flex: 1,
    backgroundColor: '#011D5A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  careTankModalBtnExit: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  careTankModalBtnExitText: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: '700',
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
