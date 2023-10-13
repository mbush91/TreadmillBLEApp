/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type {PropsWithChildren} from 'react';
import {BleManager, Device} from 'react-native-ble-plx';
import {useEffect, useState, useCallback} from 'react';
import {FlatList, Button, TextInput} from 'react-native';
import Treadmill from './Treadmill';
import useBLEApi from './BLE';
import Settings from './Settings';

import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({children, title}: SectionProps): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function App(): JSX.Element {
  const {
    scanTreadmillDevice,
    connectDevice,
    disconnectFromDevice,
    updateTreadmillSpeed,
    scanHRDevice,
    requestPermissions,
    heartRate,
    setSpeed,
  } = useBLEApi();

  const [lastCalled, setLastCalled] = useState<number | null>(null);
  const [calcSpeed, setCalcSpeed] = useState<number>(0);
  const [restHR, setRestHR] = useState<number>(0);
  const [maxHR, setMaxHR] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [restSpeed, setRestSpeed] = useState<number>(0);
  const isDarkMode = useColorScheme() === 'dark';
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [isHRRampUp, setIsHRRampUp] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSettingsVisible, setIsSettingsVisible] = useState(true);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const toggleSettings = () => {
    setIsSettingsVisible(!isSettingsVisible);
  };

  const saveSettings = newSettings => {
    setMaxHR(newSettings.maxHR);
    setRestHR(newSettings.restHR);
    setMaxSpeed(newSettings.maxSpeed);
    setRestSpeed(newSettings.restSpeed);
    toggleSettings(); // Close the settings after saving
  };

  const workoutSprints = () => {
    if (isHRRampUp) {
      if (heartRate < maxHR) {
        setCalcSpeed(maxSpeed);
      } else {
        setIsHRRampUp(false);
        setCalcSpeed(restSpeed);
      }
    } else {
      // HR is ramping down
      if (heartRate > restHR) {
        setCalcSpeed(restSpeed);
      } else {
        // Heart rate is below restHR
        setIsHRRampUp(true);
        setCalcSpeed(maxSpeed);
      }
    }
  };

  const newSpeed = () => {
    const currentTime = Date.now();

    if (!lastCalled || currentTime - lastCalled > 15000) {
      workoutSprints();

      updateTreadmillSpeed(calcSpeed * 10.0);
      setLastCalled(currentTime);
      console.log('Called newSpeed');
    } else {
      console.log('Called too soon. Wait for 15 seconds.');
    }
  };

  const toggleWorkout = () => {
    if (isStopwatchRunning) {
      setIsStopwatchRunning(false); // Stop the stopwatch
    } else {
      setIsStopwatchRunning(true); // Start the stopwatch
      setElapsedTime(0);
      scanHRDevice(); // continue with your logic
    }
  };

  const formatTime = time => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (heartRate !== null) {
      console.log('Heart rate data changed:', heartRate);
      newSpeed();
    }
  }, [heartRate]); // This useEffect runs every time heartRate changes

  useEffect(() => {
    let interval;

    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
      }, 1000); // update every second
    }

    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  useEffect(() => {
    setMaxHR(175);
    setRestHR(130);
    setMaxSpeed(6.5);
    setRestSpeed(3.0);
    requestPermissions();
  }, [requestPermissions]);

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={backgroundStyle}>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          {/* Button to Scan and Connect */}
          <Section title="Workout Timer">
            <Text style={{fontSize: 40}}>{formatTime(elapsedTime)}</Text>
          </Section>
          <Button
            title={isStopwatchRunning ? 'Stop Workout' : 'Start Workout'}
            onPress={toggleWorkout}
          />
          <Section title="Heart Rate">Heart Rate: {heartRate}</Section>
          <Section title="Treadmill Status">
            Speed: {calcSpeed} Incline: 0
          </Section>
          <Section title="Settings">
            <View style={{flexDirection: 'column'}}>
              <Text>Max HR: {maxHR}</Text>
              <Text>Rest HR: {restHR}</Text>
              <Text>Max Speed: {maxSpeed}</Text>
              <Text>Rest Speed: {restSpeed}</Text>
            </View>
          </Section>
          <Button title="Settings" onPress={toggleSettings} />
          {isSettingsVisible ? (
            <Settings
              maxHR={maxHR}
              restHR={restHR}
              maxSpeed={maxSpeed}
              restSpeed={restSpeed}
              onSave={saveSettings}
            />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});

export default App;
