/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import React, { Dispatch, SetStateAction } from 'react';
import { BleManager, Device, LogLevel } from 'react-native-ble-plx';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { PermissionsAndroid } from 'react-native';
import { Buffer } from 'buffer';
import Treadmill from './Treadmill';

interface BLEApi {
    requestPermissions: () => Promise<boolean>;
    scanHRDevice(): void;
    scanTreadmillDevice(): () => Promise<Device | null>;
    connectDevice(device: Device): () => Promise<void>;
    disconnectFromDevice(device: Device): () => void;
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

    const uint8ArrayToBase64 = (data: Uint8Array): string => {
        return Buffer.from(data).toString('base64');
    };


    const updateTreadmillSpeed = (newSpeed: number) => {
        if (connectedTreadmill) {
            // If we have a connected device, just write the new speed to it
            writeToTreadmill(connectedTreadmill, newSpeed);
        } else {
            // If not, we start the scan and then write the new speed
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
                            setConnectedTreadmill(device);  // Save the connected device
                            writeToTreadmill(device, newSpeed);
                        })
                        .catch(err => {
                            console.warn('Error', err);
                        });
                }
            });
        }
    };

    const writeToTreadmill = (device: Device, newSpeed: number) => {
        device.discoverAllServicesAndCharacteristics()
            .then(() => {
                return device.characteristicsForService(treadmilService);
            })
            .then(characteristics => {
                console.log('characteristics', characteristics);
                return device.writeCharacteristicWithResponseForService(
                    treadmilService,
                    treadmilWrite,
                    uint8ArrayToBase64(Treadmill.setSpeed(0, newSpeed)),
                );
            })
            .then(() => {
                console.log('wrote to treadmill');
            })
            .catch(err => {
                console.warn('Error', err);
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

    const disconnectFromDevice = (device: Device) => { };

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
                                    if (characteristic && characteristic.value) {
                                        const data = Buffer.from(characteristic.value, 'base64')[1];
                                        setHeartRate(data);
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
        disconnectFromDevice,
        updateTreadmillSpeed,
        scanHRDevice,
        requestPermissions,
        heartRate,
        setSpeed,
    };
}

export default useBLEApi;
