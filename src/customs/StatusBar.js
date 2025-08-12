import { View, Text, StatusBar } from 'react-native';
import React from 'react';

const StatusBarComponent = () => {
  return (
    <StatusBar
      backgroundColor="transparent"
      translucent
      barStyle="light-content"
    />
  );
};

export default StatusBarComponent;
