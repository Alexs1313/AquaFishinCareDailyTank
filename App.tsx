import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AquaFishinStack from './AquaFishinCareDailyTank/AquaFishinNavigation/AquaFishinStack';

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <AquaFishinStack />
    </NavigationContainer>
  );
};

export default App;
