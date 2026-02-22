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
import type { StackList } from '../AquaFishinNavigation/AquaFishinStack';

type NavigationProp = StackNavigationProp<StackList, 'OnboardScreens'>;

type SlideItem = {
  title: string;
  description: string;
  buttonText: string;
  showProgressBars: boolean;
  image?: ImageSourcePropType;
};

const SLIDES: SlideItem[] = [
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const slide = SLIDES[currentIndex];

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate('AquaFishinTab');
    }
  };

  return (
    <ImageBackground
      source={require('../AquaAssets/images/onboard/back.png')}
      style={onboardBg}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={onboardScrollContent}
      >
        <View style={[onboardContainer, { paddingTop: insets.top }]}>
          <Image source={slide.image} style={onboardImage} resizeMode="contain" />

          <View style={onboardCard}>
            <Text style={onboardTitle}>{slide.title}</Text>
            <Text style={onboardDescription}>{slide.description}</Text>

            <View style={onboardDots}>
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={[onboardDot, i === currentIndex && onboardDotActive]}
                />
              ))}
            </View>

            <Pressable
              onPress={goNext}
              style={({ pressed }) => [
                onboardButton,
                pressed && onboardButtonPressed,
              ]}
            >
              <Text style={onboardButtonText}>{slide.buttonText}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const onboardBg = { flex: 1 };

const onboardScrollContent = { flexGrow: 1 };

const onboardContainer = {
  flex: 1,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  paddingVertical: 20,
};

const onboardImage = {
  width: '100%' as const,
};

const onboardCard = {
  backgroundColor: '#040523',
  borderRadius: 12,
  paddingHorizontal: 24,
  padding: 24,
  width: '90%' as const,
  alignSelf: 'center' as const,
  marginTop: 16,
};

const onboardTitle = {
  fontSize: 24,
  fontWeight: '700' as const,
  color: '#fff',
  marginBottom: 12,
};

const onboardDescription = {
  fontSize: 15,
  color: 'rgba(255, 255, 255, 0.8)',
  lineHeight: 22,
  marginBottom: 24,
};

const onboardDots = {
  flexDirection: 'row' as const,
  justifyContent: 'center' as const,
  gap: 3,
  marginBottom: 24,
};

const onboardDot = {
  width: 5,
  height: 4,
  borderRadius: 2,
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
};

const onboardDotActive = {
  backgroundColor: '#45ACEC',
  width: 16,
};

const onboardButton = {
  backgroundColor: '#FF9600',
  paddingVertical: 16,
  borderRadius: 12,
  alignItems: 'center' as const,
};

const onboardButtonPressed = {
  opacity: 0.9,
};

const onboardButtonText = {
  color: '#fff',
  fontSize: 17,
  fontWeight: '700' as const,
};
