//CalculatorScreen

import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const careTankLitersPerGallon = 3.78541;

type Unit = 'L' | 'gal';
const careTankPercentMarks = [0, 25, 50, 75, 100];

const careTankRandomPercents = [10, 15, 20, 25, 30, 35, 40, 50];

function careTankPickRandomPercent(): number {
  return careTankRandomPercents[
    Math.floor(Math.random() * careTankRandomPercents.length)
  ];
}

export default function CalculatorScreen() {
  const careTankInsets = useSafeAreaInsets();
  const [careTankVolumeStr, setCareTankVolumeStr] = useState('');
  const [careTankUnit, setCareTankUnit] = useState<Unit>('L');
  const [careTankResultLiters, setCareTankResultLiters] = useState<
    number | null
  >(null);
  const [careTankResultPercent, setCareTankResultPercent] = useState<
    number | null
  >(null);

  const careTankVolume = parseFloat(careTankVolumeStr.replace(',', '.')) || 0;
  const careTankVolumeInLiters =
    careTankUnit === 'gal'
      ? careTankVolume * careTankLitersPerGallon
      : careTankVolume;

  const careTankOnCalculate = () => {
    if (careTankVolume <= 0) {
      setCareTankResultLiters(null);
      setCareTankResultPercent(null);
      return;
    }
    const careTankPercent = careTankPickRandomPercent();
    const careTankAmountLiters =
      careTankVolumeInLiters * (careTankPercent / 100);
    setCareTankResultPercent(careTankPercent);
    setCareTankResultLiters(careTankAmountLiters);
  };

  const careTankResultInCurrentUnit =
    careTankResultLiters != null
      ? careTankUnit === 'gal'
        ? careTankResultLiters / careTankLitersPerGallon
        : careTankResultLiters
      : 0;

  const careTankUnitLabel = careTankUnit === 'gal' ? 'gal' : 'liters';

  const careTankDisplayPercent = careTankResultPercent ?? 0;
  const careTankClosestMark = careTankPercentMarks.reduce((prev, curr) =>
    Math.abs(curr - careTankDisplayPercent) <
    Math.abs(prev - careTankDisplayPercent)
      ? curr
      : prev,
  );

  return (
    <View style={styles.careTankContainer}>
      <KeyboardAvoidingView
        style={styles.careTankFlex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.careTankScrollContent,
            { paddingTop: careTankInsets.top + 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['#183173', '#45ACEC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.careTankHeaderCard}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
            >
              <Image
                source={require('../AquaAssets/images/calcman.png')}
                style={styles.careTankHeaderImage}
              />
              <View style={styles.careTankHeaderTextWrap}>
                <Text style={styles.careTankHeaderTitle}>
                  Water Change Calculator
                </Text>
                <Text style={styles.careTankHeaderSubtitle}>
                  Calculate how much water to replace to keep your aquarium
                  stable
                </Text>
              </View>
            </View>
          </LinearGradient>

          <Text style={styles.careTankLabel}>Enter volume</Text>
          <View style={styles.careTankVolumeRow}>
            <TextInput
              style={styles.careTankVolumeInput}
              value={careTankVolumeStr}
              onChangeText={setCareTankVolumeStr}
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="decimal-pad"
            />
            <Pressable
              style={styles.careTankUnitBtn}
              onPress={() => setCareTankUnit(u => (u === 'gal' ? 'L' : 'gal'))}
            >
              <Text style={styles.careTankUnitBtnText}>{careTankUnit}</Text>
            </Pressable>
          </View>

          <View style={styles.careTankPercentHeader}>
            <Text style={styles.careTankLabel}>Water change</Text>
          </View>
          <View style={styles.careTankPercentTrack}>
            <View
              style={[
                styles.careTankPercentFill,
                { width: `${careTankDisplayPercent}%` },
              ]}
            />
          </View>
          <View style={styles.careTankPercentLabels}>
            {careTankPercentMarks.map(careTankPercentMark => (
              <View
                key={careTankPercentMark}
                style={styles.careTankPercentOption}
              >
                <Text
                  style={[
                    styles.careTankPercentOptionText,
                    careTankDisplayPercent > 0 &&
                      careTankPercentMark === careTankClosestMark &&
                      styles.careTankPercentOptionTextActive,
                  ]}
                >
                  {careTankPercentMark}%
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            style={styles.careTankCalculateBtn}
            onPress={careTankOnCalculate}
          >
            <Text style={styles.careTankCalculateBtnText}>Calculate</Text>
          </Pressable>

          {careTankResultLiters != null &&
            careTankResultPercent != null &&
            careTankVolume > 0 && (
              <View style={styles.careTankResultCard}>
                <Text style={styles.careTankResultValue}>
                  {careTankResultInCurrentUnit.toFixed(1)} {careTankUnitLabel}
                </Text>
                <Text style={styles.careTankResultSubtext}>
                  This is {careTankResultPercent}% of your tank volume
                </Text>
              </View>
            )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  careTankContainer: {
    flex: 1,
    backgroundColor: '#011D5A',
  },
  careTankFlex: {
    flex: 1,
  },
  careTankScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  careTankHeaderCard: {
    borderRadius: 16,
    padding: 16,
    paddingBottom: 0,
    marginBottom: 24,
    alignItems: 'center',
  },
  careTankHeaderPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 182, 237, 0.4)',
  },
  careTankHeaderTextWrap: {
    flex: 1,
  },
  careTankHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    width: '80%',
  },
  careTankHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 20,
    width: '80%',
  },
  careTankHeaderImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  careTankLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#fff',
    marginBottom: 4,
  },
  careTankPercentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  careTankVolumeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  careTankVolumeInput: {
    flex: 1,
    backgroundColor: '#040523',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#fff',
    minHeight: 52,
  },
  careTankUnitBtn: {
    backgroundColor: '#040523',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 56,
  },
  careTankUnitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  careTankPercentTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  careTankPercentFill: {
    height: '100%',
    backgroundColor: '#FF9600',
    borderRadius: 4,
  },
  careTankPercentLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  careTankPercentOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  careTankPercentOptionText: {
    fontSize: 12,
    color: 'rgb(255, 255, 255)',
    fontWeight: '500',
  },
  careTankPercentOptionTextActive: {
    color: '#FF9600',
    fontWeight: '700',
  },
  careTankCalculateBtn: {
    backgroundColor: '#FF9600',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  careTankCalculateBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  careTankResultCard: {
    backgroundColor: '#02AD58',
    borderRadius: 14,
    padding: 20,
  },
  careTankResultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  careTankResultValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  careTankResultSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
});
