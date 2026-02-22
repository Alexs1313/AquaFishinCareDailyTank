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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TANK_TASKS_STORAGE_KEY = 'AQUA_TANK_TASKS_V1';
const HUE_POINTS = 15;

const HUES: { hex: string }[] = [
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

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

const sortedByLuminance = [...HUES].sort(
  (a, b) => luminance(a.hex) - luminance(b.hex),
);
const correctOrder = sortedByLuminance.map((h, i) => HUES.indexOf(h));

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function isSortedByLuminance(order: number[]): boolean {
  for (let i = 1; i < order.length; i++) {
    if (luminance(HUES[order[i]].hex) < luminance(HUES[order[i - 1]].hex))
      return false;
  }
  return true;
}

export default function HueStreamScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [order, setOrder] = useState<number[]>(() => shuffle(correctOrder));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(() => Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (completed) return;
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [completed, startTime]);

  useEffect(() => {
    if (completed) return;
    if (isSortedByLuminance(order)) {
      setCompleted(true);
      setShowSuccessModal(true);
    }
  }, [order, completed]);

  const handleBarPress = useCallback((index: number) => {
    setSelectedIndex(prev => {
      if (prev === null) return index;
      if (prev === index) return null;
      setOrder(o => {
        const next = [...o];
        [next[prev], next[index]] = [next[index], next[prev]];
        return next;
      });
      return null;
    });
  }, []);

  const timeStr = useMemo(() => {
    const m = Math.floor(elapsedSec / 60);
    const s = elapsedSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [elapsedSec]);

  const saveAndExit = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(TANK_TASKS_STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : { points: 0, completed: {} };
      const currentPoints = data.points ?? 0;
      await AsyncStorage.setItem(
        TANK_TASKS_STORAGE_KEY,
        JSON.stringify({ ...data, points: currentPoints + HUE_POINTS }),
      );
    } catch {}
    navigation.goBack();
  }, [navigation]);

  const playAgain = useCallback(() => {
    setOrder(shuffle(correctOrder));
    setSelectedIndex(null);
    setCompleted(false);
    setShowSuccessModal(false);
    setStartTime(Date.now());
    setElapsedSec(0);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.timerBox}>
          <Text style={styles.timerBoxText}>{timeStr}</Text>
        </View>
        <Pressable
          style={styles.closeBtn}
          onPress={() => setShowLeaveModal(true)}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {order.map((colorIndex, index) => (
          <Pressable
            key={`${index}-${colorIndex}`}
            style={[
              styles.bar,
              { backgroundColor: HUES[colorIndex].hex },
              selectedIndex === index && styles.barSelected,
            ]}
            onPress={() => handleBarPress(index)}
          />
        ))}
      </ScrollView>

      <Modal visible={showLeaveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Leave Game?</Text>
            <Text style={styles.modalMessage}>
              Unsaved progress will be lost. Continue?
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalBtnStay}
                onPress={() => setShowLeaveModal(false)}
              >
                <Text style={styles.modalBtnText}>Stay</Text>
              </Pressable>
              <Pressable
                style={styles.modalBtnExit}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.modalBtnExitText}>Exit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Smooth flow</Text>
            <Text style={styles.modalMessage}>
              The colors are perfectly balanced
            </Text>
            <Text style={styles.modalTime}>Time: {timeStr}</Text>
            <View style={styles.modalPointsBadge}>
              <Image
                source={require('../AquaAssets/images/points.png')}
                style={styles.modalPointsIcon}
                resizeMode="contain"
              />
              <Text style={styles.modalPointsText}>{HUE_POINTS}</Text>
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
  },
  timerBox: {
    backgroundColor: '#45ACEC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 72,
    alignItems: 'center',
  },
  timerBoxText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingTop: 8,
  },
  bar: {
    width: SCREEN_WIDTH - 32,
    height: 44,
    borderRadius: 12,
  },
  barSelected: {
    borderWidth: 3,
    borderColor: '#FF9600',
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
    paddingHorizontal: 15,
    width: '100%',
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
  modalTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginBottom: 16,
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
  modalBtnStay: {
    flex: 1,
    backgroundColor: '#011D5A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnBack: {
    flex: 1,
    backgroundColor: '#011D5A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnExit: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnExitText: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: '700',
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
