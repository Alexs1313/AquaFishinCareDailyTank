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
import type { StackList } from '../AquaFishinNavigation/AquaFishinStack';
import { useFocusEffect } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';

type NavigationProp = StackNavigationProp<StackList, 'VideoLoaderScreen'>;

type Props = {
  navigation: NavigationProp;
};

const LOADER_DURATION_MS = 4500;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_OFFSET = SCREEN_WIDTH;

export default function VideoLoaderScreen({ navigation }: Props) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideText = useRef(new Animated.Value(-SLIDE_OFFSET)).current;
  const slidePerson = useRef(new Animated.Value(SLIDE_OFFSET)).current;

  useFocusEffect(
    React.useCallback(() => {
      Orientation.lockToPortrait();
      return () => Orientation.unlockAllOrientations();
    }, []),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideText, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(slidePerson, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      navigation.replace('OnboardScreens');
    }, LOADER_DURATION_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../AquaAssets/images/onboard/back.png')}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content} pointerEvents="box-none">
        <Animated.View
          style={[styles.textWrap, { transform: [{ translateX: slideText }] }]}
        >
          {Platform.OS === 'ios' ? (
            <Image
              source={require('../AquaAssets/images/introloader.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={require('../AquaAssets/images/introloaderandr.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.personWrap,
            { transform: [{ translateX: slidePerson }] },
          ]}
        >
          <Image
            source={require('../AquaAssets/images/introloade2.png')}
            style={styles.personImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    overflow: 'hidden',
  },
  textWrap: {
    alignSelf: 'flex-start',
    maxWidth: '75%',
    minWidth: 200,
    marginBottom: 24,
  },
  logoImage: {
    width: 250,
    height: 150,
  },
  personWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    minHeight: 280,
  },
});
