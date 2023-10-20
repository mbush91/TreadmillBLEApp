/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import React, { Dispatch, SetStateAction } from 'react';
import { BleManager, Device, LogLevel } from 'react-native-ble-plx';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { PermissionsAndroid } from 'react-native';
import { Buffer } from 'buffer';
import Treadmill from './Treadmill';
import { postToAPI } from './TreadMillDataApi';

interface BLEApi {
    requestPermissions: () => Promise<boolean>;
    scanHRDevice(): void;
    scanTreadmillDevice(): () => Promise<Device | null>;
    connectDevice(device: Device): () => Promise<void>;
    endSession: () => void;
    heartRate: number;
    setSpeed: Dispatch<SetStateAction<number>>;
}

function useBLEApi(): BLEApi {

    const smartWatchMac = '90:F1:57:BE:DF:5E';
    const treadmilMac = 'FE:FA:59:F4:B9:B1';
    const treadmilService = '0000fff0-0000-1000-8000-00805f9b34fb';
    const treadmilWrite = '0000FFF3-0000-1000-8000-00805f9b34fb';
    const treadmilNotify = '0000FFF4-0000-1000-8000-00805f9b34fb';

    const [heartRate, setHeartRate] = useState<number>(0);
    const [speed, setSpeed] = useState<number>(0);
    const manager = useMemo(() => new BleManager(), []);
    const [connectedTreadmill, setConnectedTreadmill] = useState<Device | null>(null);
    const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);

    const uint8ArrayToBase64 = (data: Uint8Array): string => {
        return Buffer.from(data).toString('base64');
    };


    const updateTreadmill = (newSpeed: number, newIncline: number) => {
        if (connectedTreadmill) {
            // If we have a connected device, just write the new speed to it
            writeToTreadmill(connectedTreadmill, newSpeed, newIncline);
        } else {
            // If not, we start the scan and then write the new speed
            console.log('Scan for Treadmill');
            manager.startDeviceScan(null, null, (error, device) => {
                if (error) {
                    console.log('Error during scan:', error);
                    if (error.reason) {
                        console.log('Error reason:', error.reason);
                    }
                    return;
                }

                if (device && device.id === treadmilMac) {
                    manager.stopDeviceScan();
                    device
                        .connect()
                        .then(() => {
                            setConnectedDevices(prevDevices => [...prevDevices, device]);
                            setConnectedTreadmill(device);  // Save the connected device
                            writeToTreadmill(device, newSpeed, newIncline);
                        })
                        .catch(err => {
                            console.warn('Error', err);
                        });
                }
            });
        }
    };

    const writeToTreadmill = (device: Device, newSpeed: number, newIncline: number) => {
        device.discoverAllServicesAndCharacteristics()
            .then(() => {
                console.log('discovered all services and characteristics');
                return device.characteristicsForService(treadmilService);
            })
            .then(characteristics => {
                //console.log('characteristics', characteristics);
                console.log('writing speed to treadmill: ', newSpeed);
                return device.writeCharacteristicWithResponseForService(
                    treadmilService,
                    treadmilWrite,
                    uint8ArrayToBase64(Treadmill.setSpeed(0, newSpeed)),
                );
            })
            .then(() => {
                //console.log('characteristics', characteristics);
                console.log('writing incline to treadmill: ', newSpeed);
                return device.writeCharacteristicWithResponseForService(
                    treadmilService,
                    treadmilWrite,
                    uint8ArrayToBase64(Treadmill.setIncline(newIncline)),
                );
            })
            .then(() => {
                postToAPI({newSpeed: newSpeed, newIncline: newIncline});
                console.log('wrote to treadmill');
            })
            .catch(err => {
                console.warn('Error', err);
                setConnectedTreadmill(null);
            });
    };

    const scanTreadmillDevice = () => {
        manager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.log('Error during scan:', error);
                if (error.reason) {
                    console.log('Error reason:', error.reason);
                }
                return;
            }

            if (device && device.id === treadmilMac) {
                manager.stopDeviceScan();
                device
                    .connect()
                    .then(connectedDevice => {
                        setConnectedDevices(prevDevices => [...prevDevices, device]);
                        return device.discoverAllServicesAndCharacteristics();
                    })
                    .then(device => {

                    })
                    .catch(err => {
                        console.warn('Error connecting to device:', err);

                    });
            }
        });

    };

    const connectDevice = (device: Device) => { };

    const scanHRDevice = () => {
        manager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.log('Error during scan:', error);
                if (error.reason) {
                    console.log('Error reason:', error.reason);
                }
                return;
            }

            if (device && device.id === smartWatchMac) {
                manager.stopDeviceScan();
                device
                    .connect()
                    .then(device => {
                        console.log(
                            'Connected to device, discovering services and characteristics...',
                        );
                        setConnectedDevices(prevDevices => [...prevDevices, device]);
                        return device.discoverAllServicesAndCharacteristics();
                    })
                    .then(device => {
                        console.log('Monitoring for characteristic updates...');
                        if (device.id === smartWatchMac) {
                            const subscription = device.monitorCharacteristicForService(
                                '180D',
                                '2A37',
                                (error, characteristic) => {
                                    if (error) {
                                        console.error('Error monitoring characteristic:', error);
                                        return;
                                    }
                                    if (characteristic && characteristic.value) {
                                        const data = Buffer.from(characteristic.value, 'base64')[1];
                                        setHeartRate(data);
                                    }
                                },
                            );
                            setSubscriptions(prevSubs => [...prevSubs, subscription]);
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

    const endSession = () => {

        subscriptions.forEach(subscription => {
            subscription.remove();
        });
        setSubscriptions([]);

        connectedDevices.forEach(device => {
            device.cancelConnection()
                .then(() => {
                    console.log(`Disconnected from device: ${device.id}`);
                })
                .catch(err => {
                    console.warn(`Error disconnecting from device ${device.id}:`, err);
                });
        });

        // Clear the list of connected devices
        setConnectedDevices([]);
        setConnectedTreadmill(null);
    };


    const requestPermissions = useCallback(async () => {
        console.log('called requestPermissions');
        try {
            const granted = await PermissionsAndroid.requestMultiple(
                [
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                ],
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
                return true;
            } else {
                console.log('Bluetooth and location permission denied');
                return false;
            }
        } catch (err) {
            console.warn(err);
            return false;
        }
    }, []);



    return {
        scanTreadmillDevice,
        connectDevice,
        updateTreadmill,
        scanHRDevice,
        requestPermissions,
        heartRate,
        setSpeed,
        endSession,
    };
}

export default useBLEApi;
