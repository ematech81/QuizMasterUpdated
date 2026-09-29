import React from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

// Plain-JS checkbox, no native module. @react-native-community/checkbox
// requires native linking and isn't bundled inside Expo Go, which crashes
// with "View config not found for component `AndroidCheckBox`".
const Checkbox = ({ value, onValueChange, color = '#22c55e', size = 24 }) => {
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
    >
      <Icon
        name={value ? 'checkbox-marked' : 'checkbox-blank-outline'}
        size={size}
        color={value ? color : '#9ca3af'}
      />
    </TouchableOpacity>
  );
};

export default Checkbox;
