import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import CoreStackRouter from './CoreStackRouter';

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <CoreStackRouter />
    </NavigationContainer>
  );
};

export default App;
