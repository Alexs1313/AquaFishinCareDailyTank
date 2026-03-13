import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import VideoLoaderScreen from './Aquafishincaredailytankk/Aquafishinscreenns/VideoLoaderScreen';
import OnboardScreens from './Aquafishincaredailytankk/Aquafishinscreenns/OnboardScreens';
import AquaFishinTab from './Aquafishincaredailytankk/[Aquafishinnnavigation]/AquaFishinTab';
import BubblePopScreen from './Aquafishincaredailytankk/Aquafishinscreenns/BubblePopScreen';
import HueStreamScreen from './Aquafishincaredailytankk/Aquafishinscreenns/HueStreamScreen';

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

const CoreStackRouter: React.FC = () => {
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

export default CoreStackRouter;
