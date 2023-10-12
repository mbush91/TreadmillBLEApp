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
import { FlatList, Button, PermissionsAndroid } from 'react-native';
import Treadmill from './Treadmill';
import useBLEApi from './BLE';

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

  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const newSpeed = () => {
    const currentTime = Date.now();

    if (!lastCalled || currentTime - lastCalled > 15000) {

      // TODO : Calculate speed based on heart rate

      updateTreadmillSpeed(heartRate / 10.0);
      setLastCalled(currentTime);
      console.log('Called newSpeed');
    } else {
      console.log('Called too soon. Wait for 15 seconds.');
    }
  };

  useEffect(() => {
    if (heartRate !== null) {
      // Call your desired function or method here
      console.log('Heart rate data changed:', heartRate);
      newSpeed(heartRate/10.0);
      //treadmilScanAndConnect();
      // If you want to do an API call, you can do it here as well
      // e.g., fetch("/api/saveHeartRate", { method: "POST", body: JSON.stringify({ hr: heartRate }) });
    }
  }, [heartRate]); // This useEffect runs every time heartRate changes

  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          {/* Button to Scan and Connect */}
          <Button title="Scan and Connect" onPress={scanHRDevice} />
          <Section title="Heart Rate">Heart Rate: {heartRate}</Section>
          <Section title="Treadmill Status">Speed: 0.0 Incline: 0</Section>
          {/* <Button title="Write to Treadmill" onPress={} /> */}
          <Section title="Step One">
            Edit <Text style={styles.highlight}>App.tsx</Text> to change this
            screen and then come back to see your edits.
          </Section>
          <Section title="See Your Changes">
            <ReloadInstructions />
          </Section>
          <Section title="Debug">
            <DebugInstructions />
          </Section>
          <Section title="Learn More">
            Read the docs to discover what to do next:
          </Section>
          <LearnMoreLinks />
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
});

export default App;
