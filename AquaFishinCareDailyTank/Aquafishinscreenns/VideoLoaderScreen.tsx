// VideoLoaderScreen

import { useFocusEffect } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';

import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  Platform,
} from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';

import type { StackList } from '../Aquafishinnnavigation/AquaFishinStack';

type NavigationProp = StackNavigationProp<StackList, 'VideoLoaderScreen'>;

type Props = {
  navigation: NavigationProp;
};

const { width: careTankScreenWidth } = Dimensions.get('window');
const careTankSlideOffset = careTankScreenWidth;

export default function VideoLoaderScreen({ navigation }: Props) {
  const careTankTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const careTankSlideText = useRef(
    new Animated.Value(-careTankSlideOffset),
  ).current;
  const careTankSlidePerson = useRef(
    new Animated.Value(careTankSlideOffset),
  ).current;

  useFocusEffect(
    React.useCallback(() => {
      Orientation.lockToPortrait();
      return () => Orientation.unlockAllOrientations();
    }, []),
  );

  useEffect(() => {
    const careTankTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(careTankSlideText, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(careTankSlidePerson, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    }, 100);

    return () => clearTimeout(careTankTimer);
  }, [careTankSlidePerson, careTankSlideText]);

  useEffect(() => {
    careTankTimeoutRef.current = setTimeout(() => {
      navigation.replace('OnboardScreens');
    }, 4000);

    return () => {
      if (careTankTimeoutRef.current) {
        clearTimeout(careTankTimeoutRef.current);
      }
    };
  }, [navigation]);

  return (
    <View style={styles.careTankContainer}>
      <ImageBackground
        source={require('../AquaAssets/images/onboard/back.png')}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.careTankContent} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.careTankTextWrap,
            { transform: [{ translateX: careTankSlideText }] },
          ]}
        >
          {/* {Platform.OS === 'ios' ? (
            <Image
              source={require('../AquaAssets/images/introloader.png')}
              style={styles.careTankLogoImage}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={require('../AquaAssets/images/introloaderandr.png')}
              style={styles.careTankLogoImage}
              resizeMode="contain"
            />
          )} */}
        </Animated.View>

        <Animated.View
          style={[
            styles.careTankPersonWrap,
            { transform: [{ translateX: careTankSlidePerson }] },
          ]}
        >
          <Image
            source={require('../AquaAssets/images/introloade2.png')}
            style={styles.careTankPersonImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  careTankContainer: {
    flex: 1,
  },
  careTankContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    overflow: 'hidden',
  },
  careTankTextWrap: {
    alignSelf: 'flex-start',
    maxWidth: '75%',
    minWidth: 200,
    marginBottom: 24,
  },
  careTankLogoImage: {
    width: 250,
    height: 150,
  },
  careTankPersonWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    minHeight: 280,
  },
  careTankPersonImage: {
    width: '100%',
    height: 420,
  },
});
