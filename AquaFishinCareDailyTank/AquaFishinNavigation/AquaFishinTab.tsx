import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, StyleSheet, View } from 'react-native';
import AquariumScreen from '../AquaFishinScreens/AquariumScreen';
import TankTasksScreen from '../AquaFishinScreens/TankTasksScreen';
import FishCollectionScreen from '../AquaFishinScreens/FishCollectionScreen';
import CalculatorScreen from '../AquaFishinScreens/CalculatorScreen';

const Tab = createBottomTabNavigator();

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
      }}
    >
      <Tab.Screen
        name="AquariumScreen"
        component={AquariumScreen}
        options={{
          tabBarLabel: 'Aquarium',
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../AquaAssets/icons/aqu.png')}
              style={{ tintColor: color }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="TankTasksScreen"
        component={TankTasksScreen}
        options={{
          tabBarLabel: 'Tank Tasks',
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../AquaAssets/icons/tank.png')}
              style={{ tintColor: color }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="CollectionScreen"
        component={FishCollectionScreen}
        options={{
          tabBarLabel: 'Collection',
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../AquaAssets/icons/collection.png')}
              style={{ tintColor: color }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="CalculatorScreen"
        component={CalculatorScreen}
        options={{
          tabBarLabel: 'Calculator',
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../AquaAssets/icons/calc.png')}
              style={{ tintColor: color }}
            />
          ),
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
