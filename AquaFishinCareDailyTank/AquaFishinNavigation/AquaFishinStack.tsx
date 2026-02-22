import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AquaFishinTab from './AquaFishinTab';
import VideoLoaderScreen from '../AquaFishinScreens/VideoLoaderScreen';
import OnboardScreens from '../AquaFishinScreens/OnboardScreens';
import BubblePopScreen from '../AquaFishinScreens/BubblePopScreen';
import HueStreamScreen from '../AquaFishinScreens/HueStreamScreen';

export type StackList = {
  VideoLoaderScreen: undefined;
  OnboardScreens: undefined;
  AquaFishinTab: undefined;
  BubblePopScreen: undefined;
  HueStreamScreen: undefined;
  RegistrationScreen: undefined;
  MyProfileScreen: undefined;
  AthleteLoader: undefined;
};

const Stack = createStackNavigator<StackList>();

const AquaFishinStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VideoLoaderScreen" component={VideoLoaderScreen} />
      <Stack.Screen name="OnboardScreens" component={OnboardScreens} />
      <Stack.Screen name="AquaFishinTab" component={AquaFishinTab} />
      <Stack.Screen name="BubblePopScreen" component={BubblePopScreen} />
      <Stack.Screen name="HueStreamScreen" component={HueStreamScreen} />
    </Stack.Navigator>
  );
};

export default AquaFishinStack;
