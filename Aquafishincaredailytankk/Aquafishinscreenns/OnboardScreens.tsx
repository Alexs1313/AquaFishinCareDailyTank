// OnboardScreens

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ImageSourcePropType,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import type { StackNavigationProp } from '@react-navigation/stack';

import type { StackList } from '../[Aquafishinnnavigation]/AquaFishinStack';

type NavigationProp = StackNavigationProp<StackList, 'OnboardScreens'>;

type SlideItem = {
  title: string;
  description: string;
  buttonText: string;
  showProgressBars: boolean;
  image?: ImageSourcePropType;
};

const careTankSlides: SlideItem[] = [
  {
    title: 'A tank that lives with your care',
    description:
      'Feed your fish, keep the water clean, and tap to play. Watch Cleanliness, Hunger, and Mood shift in real time as your aquarium settles into balance.',
    buttonText: 'Continue',
    showProgressBars: true,
    image: require('../AquaAssets/images/onboard/im1.png'),
  },
  {
    title: 'Daily tasks, calm rewards',
    description:
      'Complete simple Tank Tasks, earn points, and unlock new fish and decor. Play Bubble Pop, Swipe Cleaner, and Hue Stream to collect extra points — then use the Water Change Calculator for your real aquarium.',
    buttonText: 'Start Aquarium',
    showProgressBars: false,
    image: require('../AquaAssets/images/onboard/im2.png'),
  },
];

export default function OnboardScreens() {
  const [careTankCurrentIndex, setCareTankCurrentIndex] = useState(0);
  const careTankInsets = useSafeAreaInsets();
  const careTankNavigation = useNavigation<NavigationProp>();

  const careTankSlide = careTankSlides[careTankCurrentIndex];

  const careTankGoNext = () => {
    if (careTankCurrentIndex < careTankSlides.length - 1) {
      setCareTankCurrentIndex(careTankCurrentIndex + 1);
    } else {
      careTankNavigation.navigate('AquaFishinTab');
    }
  };

  return (
    <ImageBackground
      source={require('../AquaAssets/images/onboard/back.png')}
      style={careTankOnboardBg}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={careTankOnboardScrollContent}
      >
        <View
          style={[careTankOnboardContainer, { paddingTop: careTankInsets.top }]}
        >
          <Image
            source={careTankSlide.image}
            style={careTankOnboardImage}
            resizeMode="contain"
          />

          <View style={careTankOnboardCard}>
            <Text style={careTankOnboardTitle}>{careTankSlide.title}</Text>
            <Text style={careTankOnboardDescription}>
              {careTankSlide.description}
            </Text>

            <View style={careTankOnboardDots}>
              {careTankSlides.map((_, careTankIndex) => (
                <View
                  key={careTankIndex}
                  style={[
                    careTankOnboardDot,
                    careTankIndex === careTankCurrentIndex &&
                      careTankOnboardDotActive,
                  ]}
                />
              ))}
            </View>

            <Pressable
              onPress={careTankGoNext}
              style={({ pressed }) => [
                careTankOnboardButton,
                pressed && careTankOnboardButtonPressed,
              ]}
            >
              <Text style={careTankOnboardButtonText}>
                {careTankSlide.buttonText}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const careTankOnboardBg = { flex: 1 };

const careTankOnboardScrollContent = { flexGrow: 1 };

const careTankOnboardContainer = {
  flex: 1,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  paddingVertical: 20,
};

const careTankOnboardImage = {
  width: '100%' as const,
};

const careTankOnboardCard = {
  backgroundColor: '#040523',
  borderRadius: 12,
  paddingHorizontal: 24,
  padding: 24,
  width: '90%' as const,
  alignSelf: 'center' as const,
  marginTop: 16,
};

const careTankOnboardTitle = {
  fontSize: 24,
  fontWeight: '700' as const,
  color: '#fff',
  marginBottom: 12,
};

const careTankOnboardDescription = {
  fontSize: 15,
  color: 'rgba(255, 255, 255, 0.8)',
  lineHeight: 22,
  marginBottom: 24,
};

const careTankOnboardDots = {
  flexDirection: 'row' as const,
  justifyContent: 'center' as const,
  gap: 3,
  marginBottom: 24,
};

const careTankOnboardDot = {
  width: 5,
  height: 4,
  borderRadius: 2,
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
};

const careTankOnboardDotActive = {
  backgroundColor: '#45ACEC',
  width: 16,
};

const careTankOnboardButton = {
  backgroundColor: '#FF9600',
  paddingVertical: 16,
  borderRadius: 12,
  alignItems: 'center' as const,
};

const careTankOnboardButtonPressed = {
  opacity: 0.9,
};

const careTankOnboardButtonText = {
  color: '#fff',
  fontSize: 17,
  fontWeight: '700' as const,
};
