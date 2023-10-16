/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type { PropsWithChildren } from 'react';
import { BleManager, Device } from 'react-native-ble-plx';
import { useEffect, useState, useCallback } from 'react';
import { FlatList, Button, TextInput } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
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

function Section({ children, title }: SectionProps): JSX.Element {
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

type WorkoutTypes = "Sprints" | "HillSprints";
type WorkoutSprintsStateType = "STARTING" | "RAMPUP" | "RAMPDOWN" | "STOPPED";

function App(): JSX.Element {
  const {
    scanTreadmillDevice,
    connectDevice,
    disconnectFromDevice,
    updateTreadmill,
    scanHRDevice,
    requestPermissions,
    endSession,
    heartRate,
    setSpeed,
  } = useBLEApi();

  const [lastCalled, setLastCalled] = useState<number | null>(null);
  const [calcSpeed, setCalcSpeed] = useState<number>(0);
  const [calcIncline, setCalcIncline] = useState<number>(0);
  const [restHR, setRestHR] = useState<number>(0);
  const [maxHR, setMaxHR] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [hillIncline, setHillIncline] = useState<number>(0);
  const [restSpeed, setRestSpeed] = useState<number>(0);
  const isDarkMode = useColorScheme() === 'dark';
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSettingsVisible, setIsSettingsVisible] = useState(true);
  const [workoutState, setWorkoutState] = useState<WorkoutSprintsStateType>('STOPPED');
  const [workoutType, setWorkoutType] = useState<WorkoutTypes>('Sprints');
  const [open, setOpen] = useState(false);
  const [workouts, setWorkouts] = useState([
    { label: 'Sprints', value: 'Sprints' },
    { label: 'Hill Sprints', value: 'HillSprints' }
  ]);

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
    let state_change = false;

    if (workoutState === 'STOPPED') {
      setWorkoutState('RAMPUP');
      setCalcSpeed(maxSpeed);

      if (workoutType === 'HillSprints') {
        setCalcIncline(hillIncline);
      }

      state_change = true;
    } else if (workoutState === 'RAMPUP') {
      if (heartRate >= maxHR) {
        setWorkoutState('RAMPDOWN');
        setCalcSpeed(restSpeed);
        setCalcIncline(0);
        state_change = true;
      } else {
        setCalcSpeed(maxSpeed);
        if (workoutType === 'HillSprints') {
          setCalcIncline(hillIncline);
        }
      }
    } else if (workoutState === 'RAMPDOWN') {
      if (heartRate <= restHR) {
        setWorkoutState('RAMPUP');
        setCalcSpeed(maxSpeed);
        setCalcIncline(hillIncline);
        state_change = true;
      } else {
        setCalcSpeed(restSpeed);
        setCalcIncline(0);
      }
    } else { // STARTING
      // Do nothing
    }

    return state_change;
  };

  const newSpeed = () => {
    const currentTime = Date.now();

    const state_change = workoutSprints();


    if (state_change || !lastCalled || currentTime - lastCalled > 10000) {
      updateTreadmill(calcSpeed * 10.0, calcIncline);
      setLastCalled(currentTime);
      console.log('Called newSpeed');
    } else {
      console.log('Called too soon. Wait for 15 seconds.');
    }
  };

  const toggleWorkout = () => {
    if (isStopwatchRunning) {
      setIsStopwatchRunning(false); // Stop the stopwatch
      endSession();
    } else {
      console.log('Starting Workout...');
      scanHRDevice();
    }
  };

  const formatTime = time => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const increaseSpeed = () => {
    setMaxSpeed(prevSpeed => Math.min(prevSpeed + 0.5, 10)); // Increases by 0.5, max speed set to 10
  };

  const decreaseSpeed = () => {
    setMaxSpeed(prevSpeed => Math.max(prevSpeed - 0.5, 0)); // Decreases by 0.5, min speed set to 0
  };

  const increaseIncline = () => {
    setHillIncline(prevHillIncline => Math.min(prevHillIncline + 1, 10)); // Increases by 0.5, max speed set to 10
  };

  const decreaseIncline = () => {
    setHillIncline(prevHillIncline => Math.max(prevHillIncline - 1, 0)); // Decreases by 0.5, min speed set to 0
  };

  useEffect(() => {
    if (heartRate !== null && heartRate !== 0) {
      console.log('Heart rate data changed:', heartRate);
      newSpeed();

      if (!isStopwatchRunning) {
        setIsStopwatchRunning(true);
        setElapsedTime(0);
      }
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
    setHillIncline(4);
    requestPermissions();
  }, [requestPermissions]);

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView style={backgroundStyle}>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          {/* Button to Scan and Connect */}
          <Section title="Workout Timer">
            <Text style={{ fontSize: 40 }}>{formatTime(elapsedTime)}</Text>
          </Section>
          <View style={styles.arrowContainer}>
            <Text style={styles.sectionTitle}>Run Speed: {maxSpeed} </Text>
            <Button title="▲" onPress={increaseSpeed} />
            <Button title="▼" onPress={decreaseSpeed} />
          </View>
          {workoutType === 'HillSprints' ? (
            <>
              <View style={styles.arrowContainer}>
                <Text style={styles.sectionTitle}>Incline: {hillIncline} </Text>
                <Button title="▲" onPress={increaseIncline} />
                <Button title="▼" onPress={decreaseIncline} />
              </View>
            </>
          ) : null}
          <Button
            title={isStopwatchRunning ? 'Stop Workout' : 'Start Workout'}
            onPress={toggleWorkout}
          />
          <Section title="Heart Rate">Heart Rate: {heartRate}</Section>
          <Section title="Treadmill Status">
            Speed: {calcSpeed} Incline: 0
          </Section>
          <Section title="Workout">
            {workoutType.toString()}
          </Section>
          <Section title="Settings">
            <View style={{ flexDirection: 'column' }}>
              <Text>Max HR: {maxHR}</Text>
              <Text>Rest HR: {restHR}</Text>
              <Text>Max Speed: {maxSpeed}</Text>
              <Text>Rest Speed: {restSpeed}</Text>
              <Text>Hill Incline: {hillIncline}</Text>
              <DropDownPicker
                open={open}
                value={workoutType}
                items={workouts}
                setOpen={setOpen}
                setValue={setWorkoutType}
                setItems={setWorkouts}
              />
            </View>
          </Section>
          <Button title="Settings" onPress={toggleSettings} />
          {isSettingsVisible ? (
            <Settings
              maxHR={maxHR}
              restHR={restHR}
              maxSpeed={maxSpeed}
              restSpeed={restSpeed}
              hillIncline={hillIncline}
              onSave={saveSettings}
            />
          ) : null}
        </View>
      </ScrollView>
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
  arrowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
});

export default App;
