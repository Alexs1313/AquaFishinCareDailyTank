import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import React, { useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet } from 'react-native';
import AquariumScreen from '../Aquafishinscreenns/AquariumScreen';
import TankTasksScreen from '../Aquafishinscreenns/TankTasksScreen';
import FishCollectionScreen from '../Aquafishinscreenns/FishCollectionScreen';
import CalculatorScreen from '../Aquafishinscreenns/CalculatorScreen';

const Tab = createBottomTabNavigator();
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AquaFishinTabButton({
  onPressIn,
  onPressOut,
  style,
  ...props
}: BottomTabBarButtonProps) {
  const careTankScale = useRef(new Animated.Value(1)).current;

  const careTankHandlePressIn: BottomTabBarButtonProps['onPressIn'] = e => {
    Animated.spring(careTankScale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 35,
      bounciness: 6,
    }).start();
    onPressIn?.(e);
  };

  const careTankHandlePressOut: BottomTabBarButtonProps['onPressOut'] = e => {
    Animated.spring(careTankScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 35,
      bounciness: 6,
    }).start();
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      {...props}
      style={[style, { transform: [{ scale: careTankScale }] }]}
      onPressIn={careTankHandlePressIn}
      onPressOut={careTankHandlePressOut}
    />
  );
}

const careTankRenderTabButton = (props: BottomTabBarButtonProps) => (
  <AquaFishinTabButton {...props} />
);

const careTankAquariumIcon = ({ color }: { color: string }) => (
  <Image source={require('../AquaAssets/icons/aqu.png')} style={{ tintColor: color }} />
);

const careTankTasksIcon = ({ color }: { color: string }) => (
  <Image source={require('../AquaAssets/icons/tank.png')} style={{ tintColor: color }} />
);

const careTankCollectionIcon = ({ color }: { color: string }) => (
  <Image
    source={require('../AquaAssets/icons/collection.png')}
    style={{ tintColor: color }}
  />
);

const careTankCalculatorIcon = ({ color }: { color: string }) => (
  <Image source={require('../AquaAssets/icons/calc.png')} style={{ tintColor: color }} />
);

const AquaFishinTab = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.bottomTabBar,
        tabBarActiveTintColor: '#FF9600',
        tabBarInactiveTintColor: '#FFF',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarButton: careTankRenderTabButton,
      }}
    >
      <Tab.Screen
        name="AquariumScreen"
        component={AquariumScreen}
        options={{
          tabBarLabel: 'Aquarium',
          tabBarIcon: careTankAquariumIcon,
        }}
      />
      <Tab.Screen
        name="TankTasksScreen"
        component={TankTasksScreen}
        options={{
          tabBarLabel: 'Tank Tasks',
          tabBarIcon: careTankTasksIcon,
        }}
      />
      <Tab.Screen
        name="CollectionScreen"
        component={FishCollectionScreen}
        options={{
          tabBarLabel: 'Collection',
          tabBarIcon: careTankCollectionIcon,
        }}
      />
      <Tab.Screen
        name="CalculatorScreen"
        component={CalculatorScreen}
        options={{
          tabBarLabel: 'Calculator',
          tabBarIcon: careTankCalculatorIcon,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  bottomTabBar: {
    position: 'absolute',
    elevation: 0,
    backgroundColor: '#040523',
    paddingTop: 10,
    paddingHorizontal: 10,
    height: 90,
    borderWidth: 1,
    borderColor: '040523',
    borderTopWidth: 1,
  },
  tabActive: {
    padding: 9,
    backgroundColor: '#F21D16',
    borderRadius: 12,
    alignSelf: 'center',
  },
  tabBarLabel: {
    fontSize: 10,
    marginTop: 4,
  },
});

export default AquaFishinTab;
