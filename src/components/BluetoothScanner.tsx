import React, { useState } from 'react';
import { Bluetooth, BluetoothOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils/cn';

interface BluetoothScannerProps {
  onDeviceConnected: (device: any) => void;
  connectedDevice: any;
}

export const BluetoothScanner = ({ onDeviceConnected, connectedDevice }: BluetoothScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScan = async () => {
    setIsScanning(true);
    setError(null);
    try {
      // Web Bluetooth API
      const nav = navigator as any;
      if (!nav.bluetooth) {
        throw new Error('Bluetooth is not supported in this browser. Please use Chrome or Edge.');
      }

      const device = await nav.bluetooth.requestDevice({
        filters: [
          { name: 'Smart Dukaan' },
          { namePrefix: 'Smart' },
          { namePrefix: 'ESP32' }
        ],
        optionalServices: [
          '00001800-0000-1000-8000-00805f9b34fb', // Generic Access
          '00001801-0000-1000-8000-00805f9b34fb', // Generic Attribute
          '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
          '0000ffe0-0000-1000-8000-00805f9b34fb', // Common ESP32 UART Service
        ]
      });

      console.log('Connecting to GATT Server...');
      const server = await device.gatt.connect();
      
      // Try to find a characteristic that supports notifications
      try {
        const services = await server.getPrimaryServices();
        for (const service of services) {
          const characteristics = await service.getCharacteristics();
          for (const characteristic of characteristics) {
            if (characteristic.properties.notify) {
              await characteristic.startNotifications();
              characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
                const value = event.target.value;
                console.log('Received data:', value);
                // You can parse the value here and call a callback
              });
              console.log('Subscribed to notifications on:', characteristic.uuid);
            }
          }
        }
      } catch (e) {
        console.warn('Could not discover services/characteristics:', e);
      }
      
      onDeviceConnected(device);

      // Handle disconnection
      device.addEventListener('gattserverdisconnected', () => {
        console.log('Device disconnected');
        onDeviceConnected(null);
      });

    } catch (err: any) {
      console.error('Bluetooth Error:', err);
      if (err.name === 'NotFoundError' || err.name === 'AbortError' || err.message.includes('cancelled')) {
        setError('Connection cancelled. Please select a device to connect.');
      } else if (err.name === 'SecurityError') {
        setError('Bluetooth permission denied. Please check your browser settings.');
      } else {
        setError(err.message || 'Failed to connect to device.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const disconnect = () => {
    if (connectedDevice?.gatt?.connected) {
      connectedDevice.gatt.disconnect();
    }
    onDeviceConnected(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Device Connection</h1>
        <p className="text-sm text-zinc-500">Connect your smart device via Bluetooth</p>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-6 text-center">
          <motion.div
            animate={isScanning ? { scale: [1, 1.1, 1], opacity: [1, 0.5, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={cn(
              "flex h-24 w-24 items-center justify-center rounded-full shadow-lg",
              connectedDevice ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400"
            )}
          >
            {connectedDevice ? <Bluetooth size={40} /> : <BluetoothOff size={40} />}
          </motion.div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold">
              {connectedDevice ? connectedDevice.name || 'Smart Device' : 'No Device Connected'}
            </h3>
            <p className="text-sm text-zinc-500">
              {connectedDevice ? 'Status: Connected' : 'Status: Disconnected'}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-medium text-rose-600">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {connectedDevice ? (
            <button
              onClick={disconnect}
              className="w-full rounded-2xl border border-zinc-200 py-4 font-semibold text-zinc-500 hover:bg-zinc-50"
            >
              Disconnect Device
            </button>
          ) : (
            <button
              onClick={startScan}
              disabled={isScanning}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-semibold text-white shadow-lg shadow-emerald-100 transition-transform active:scale-95 disabled:opacity-50"
            >
              {isScanning ? <RefreshCw size={20} className="animate-spin" /> : <Bluetooth size={20} />}
              {isScanning ? 'Scanning...' : 'Connect Device'}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-indigo-50 p-6 text-indigo-900">
        <h4 className="mb-2 text-sm font-bold">How it works?</h4>
        <ul className="space-y-2 text-xs opacity-80">
          <li className="flex gap-2">
            <CheckCircle2 size={14} className="shrink-0" />
            Turn on your Smart Device's Bluetooth.
          </li>
          <li className="flex gap-2">
            <CheckCircle2 size={14} className="shrink-0" />
            Click "Connect Device" and select your device.
          </li>
          <li className="flex gap-2">
            <CheckCircle2 size={14} className="shrink-0" />
            Data from device will automatically appear in the app.
          </li>
        </ul>
      </div>
    </div>
  );
};
