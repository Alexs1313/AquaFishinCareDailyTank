import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LITERS_PER_GALLON = 3.78541;

type Unit = 'L' | 'gal';
const PERCENT_MARKS = [0, 25, 50, 75, 100];

const RANDOM_PERCENTS = [10, 15, 20, 25, 30, 35, 40, 50];

function pickRandomPercent(): number {
  return RANDOM_PERCENTS[Math.floor(Math.random() * RANDOM_PERCENTS.length)];
}

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const [volumeStr, setVolumeStr] = useState('');
  const [unit, setUnit] = useState<Unit>('L');
  const [resultLiters, setResultLiters] = useState<number | null>(null);
  const [resultPercent, setResultPercent] = useState<number | null>(null);

  const volume = parseFloat(volumeStr.replace(',', '.')) || 0;
  const volumeInLiters = unit === 'gal' ? volume * LITERS_PER_GALLON : volume;

  const onCalculate = () => {
    if (volume <= 0) {
      setResultLiters(null);
      setResultPercent(null);
      return;
    }
    const percent = pickRandomPercent();
    const amountLiters = volumeInLiters * (percent / 100);
    setResultPercent(percent);
    setResultLiters(amountLiters);
  };

  const resultInCurrentUnit =
    resultLiters != null
      ? unit === 'gal'
        ? resultLiters / LITERS_PER_GALLON
        : resultLiters
      : 0;
  const unitLabel = unit === 'gal' ? 'gal' : 'liters';

  const displayPercent = resultPercent ?? 0;
  const closestMark = PERCENT_MARKS.reduce((prev, curr) =>
    Math.abs(curr - displayPercent) < Math.abs(prev - displayPercent)
      ? curr
      : prev,
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['#183173', '#45ACEC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
            >
              <Image
                source={require('../AquaAssets/images/calcman.png')}
                style={styles.headerImage}
              />
              <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle}>Water Change Calculator</Text>
                <Text style={styles.headerSubtitle}>
                  Calculate how much water to replace to keep your aquarium
                  stable
                </Text>
              </View>
            </View>
          </LinearGradient>

          <Text style={styles.label}>Enter volume</Text>
          <View style={styles.volumeRow}>
            <TextInput
              style={styles.volumeInput}
              value={volumeStr}
              onChangeText={setVolumeStr}
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="decimal-pad"
            />
            <Pressable
              style={styles.unitBtn}
              onPress={() => setUnit(u => (u === 'gal' ? 'L' : 'gal'))}
            >
              <Text style={styles.unitBtnText}>{unit}</Text>
            </Pressable>
          </View>

          <View style={styles.percentHeader}>
            <Text style={styles.label}>Water change</Text>
          </View>
          <View style={styles.percentTrack}>
            <View
              style={[styles.percentFill, { width: `${displayPercent}%` }]}
            />
          </View>
          <View style={styles.percentLabels}>
            {PERCENT_MARKS.map(p => (
              <View key={p} style={styles.percentOption}>
                <Text
                  style={[
                    styles.percentOptionText,
                    displayPercent > 0 &&
                      p === closestMark &&
                      styles.percentOptionTextActive,
                  ]}
                >
                  {p}%
                </Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.calculateBtn} onPress={onCalculate}>
            <Text style={styles.calculateBtnText}>Calculate</Text>
          </Pressable>

          {resultLiters != null && resultPercent != null && volume > 0 && (
            <View style={styles.resultCard}>
              <Text style={styles.resultValue}>
                {resultInCurrentUnit.toFixed(1)} {unitLabel}
              </Text>
              <Text style={styles.resultSubtext}>
                This is {resultPercent}% of your tank volume
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#011D5A',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  headerCard: {
    borderRadius: 16,
    padding: 16,
    paddingBottom: 0,
    marginBottom: 24,
    alignItems: 'center',
  },
  headerPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 182, 237, 0.4)',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '400',
    color: '#fff',
    marginBottom: 4,
  },
  percentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  volumeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  volumeInput: {
    flex: 1,
    backgroundColor: '#040523',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#fff',
    minHeight: 52,
  },
  unitBtn: {
    backgroundColor: '#040523',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 56,
  },
  unitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  percentTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  percentFill: {
    height: '100%',
    backgroundColor: '#FF9600',
    borderRadius: 4,
  },
  percentLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  percentOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  percentOptionText: {
    fontSize: 12,
    color: 'rgb(255, 255, 255)',
    fontWeight: '500',
  },
  percentOptionTextActive: {
    color: '#FF9600',
    fontWeight: '700',
  },
  calculateBtn: {
    backgroundColor: '#FF9600',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  calculateBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: '#02AD58',
    borderRadius: 14,
    padding: 20,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  resultSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
});
