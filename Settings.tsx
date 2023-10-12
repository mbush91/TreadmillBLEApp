// Settings.tsx

import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

function Settings(props) {
  // Assuming these are the settings you want to modify
  const [maxHR, setMaxHR] = useState(props.maxHR || 0);
  const [restHR, setRestHR] = useState(props.restHR || 0);
  const [maxSpeed, setMaxSpeed] = useState(props.maxSpeed || 0);
  const [restSpeed, setRestSpeed] = useState(props.restSpeed || 0);

  const handleSave = () => {
    // Pass the settings back to the parent
    props.onSave({ maxHR, restHR, maxSpeed, restSpeed });
  };

  return (
    <>
      <TextInput
        value={String(maxHR)}
        onChangeText={setMaxHR}
        placeholder="Max HR"
      />
      <TextInput
        value={String(restHR)}
        onChangeText={setRestHR}
        placeholder="Rest HR"
      />
      <TextInput
        value={String(maxSpeed)}
        onChangeText={setMaxSpeed}
        placeholder="Max Speed"
      />
      <TextInput
        value={String(restSpeed)}
        onChangeText={setRestSpeed}
        placeholder="Rest Speed"
      />
      <Button title="Save Settings" onPress={handleSave} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

export default Settings;
