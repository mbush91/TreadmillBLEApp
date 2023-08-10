/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type {PropsWithChildren} from 'react';
import {BleManager} from 'react-native-ble-plx';
import {useEffect, useState} from 'react';
import {FlatList, Button, PermissionsAndroid} from 'react-native';
import {Buffer} from 'buffer';
import Treadmill from './Treadmill';

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
  const [manager, setManager] = useState(new BleManager());
  const [device, setDevice] = useState(null);
  const [data, setData] = useState(null);
  const [devices, setDevices] = useState([]);

  const isDarkMode = useColorScheme() === 'dark';
  const smartWatchMac = '90:F1:57:BE:DF:5E';
  const treadmilMac = 'FE:FA:59:F4:B9:B1';
  const treadmilService = '0000fff0-0000-1000-8000-00805f9b34fb';
  const treadmilWrite = '0000FFF3-0000-1000-8000-00805f9b34fb';
  const treadmilNotify = '0000FFF4-0000-1000-8000-00805f9b34fb';

  const uint8ArrayToBase64 = (data: Uint8Array): string => {
    return Buffer.from(data).toString('base64');
  };

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  async function updateSpeed() {
    if (device) {
      const speed = uint8ArrayToBase64(Treadmill.setSpeed(0, 60));
      console.log('speed: ', speed);
      const characteristic = device.writeCharacteristicWithResponseForService(
        treadmilService,
        treadmilWrite,
        speed,
      );
    }
  }

  async function requestPermissions() {
    console.log('called requestPermissions');
    try {
      const granted = await PermissionsAndroid.requestMultiple(
        [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ],
        {
          title: 'Bluetooth LE App Permission',
          message: 'BLE App needs access to your Bluetooth and location ',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
          PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log('You can use the BLE ');
      } else {
        console.log('Bluetooth and location permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  }

  useEffect(() => {
    requestPermissions();
  }, []);

  const scanAndConnect = () => {
    console.log('Scan started');

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('Error during scan:', error);
        if (error.reason) {
          console.log('Error reason:', error.reason);
        }
        return;
      }

      console.log('Device found:', device.name || 'Unnamed', '-', device.id);

      if (device.id === smartWatchMac || device.id === treadmilMac) {
        console.log(
          'Target device found, stopping scan and attempting connection...',
        );
        manager.stopDeviceScan();

        device
          .connect()
          .then(device => {
            console.log(
              'Connected to device, discovering services and characteristics...',
            );
            return device.discoverAllServicesAndCharacteristics();
          })
          .then(device => {
            console.log('Monitoring for characteristic updates...');
            if (device.id === smartWatchMac) {
              device.monitorCharacteristicForService(
                '180D',
                '2A37',
                (error, characteristic) => {
                  if (error) {
                    console.error('Error monitoring characteristic:', error);
                    return;
                  }
                  if (characteristic) {
                    const data = Buffer.from(characteristic.value, 'base64')[1];
                    console.log('Received data:', data);
                    setData(data);
                  }
                },
              );
            } else if (device.id === treadmilMac) {
              // You will need to replace 'Your_Service_UUID' and 'Your_Characteristic_UUID' with
              // the correct service and characteristic UUIDs for your treadmill.
              setDevice(device);
              const speed = uint8ArrayToBase64(Treadmill.setSpeed(0, 60));
              console.log('speed: ', speed);

              device.monitorCharacteristicForService(
                treadmilService,
                treadmilNotify,
                (error, characteristic) => {
                  if (error) {
                    console.error('Error monitoring characteristic:', error);
                    return;
                  }
                  if (characteristic) {
                    const data = Buffer.from(characteristic.value, 'base64');
                    console.log('Received TM data:', data);

                    // Here, you should call a function to update the state for the treadmill's data
                  }
                },
              );
            }
          })
          .catch(error => {
            console.log(
              'Error during device connection or service discovery:',
              error,
            );
          });
      }
    });
  };

  useEffect(() => {
    const subscription = manager.onStateChange(state => {
      if (state === 'PoweredOn') {
        //scanAndConnect();
      }
    }, true);
    return () => {
      subscription.remove();
    };
  }, []);

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
          <Button title="Scan and Connect" onPress={scanAndConnect} />
          <Section title="Heart Rate">Heart Rate: {data}</Section>
          <Section title="Treadmill Status">Speed: 0.0 Incline: 0</Section>

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
