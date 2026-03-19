import React, { useState, useEffect } from 'react';
import { Printer, Usb, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils/cn';

interface USBPrinterConnectorProps {
  onPrinterConnected: (device: USBDevice | null) => void;
  connectedPrinter: USBDevice | null;
}

export const USBPrinterConnector = ({ onPrinterConnected, connectedPrinter }: USBPrinterConnectorProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (!navigator.usb) {
      setIsSupported(false);
      setError("WebUSB is not supported in this browser or connection. Please use Chrome/Edge on a secure (HTTPS) connection.");
    }
  }, []);

  const connectPrinter = async () => {
    try {
      if (!navigator.usb) throw new Error("WebUSB not supported");
      setError(null);
      const device = await navigator.usb.requestDevice({
        filters: [] // Request all devices, user will pick the printer
      });
      
      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
      await device.claimInterface(0);
      
      onPrinterConnected(device);
    } catch (err: any) {
      console.error("USB Connection Error:", err);
      if (err.name === 'NotFoundError' || err.name === 'AbortError' || err.message.includes('cancelled')) {
        setError("Connection cancelled. Please select your printer from the list.");
      } else if (err.name === 'SecurityError' || err.message.includes('disallowed')) {
        setError("USB access is restricted. Please check your permissions and ensure you're using a secure connection.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to connect printer");
      }
    }
  };

  const disconnectPrinter = async () => {
    if (connectedPrinter) {
      try {
        await connectedPrinter.close();
      } catch (e) {
        console.error("Error closing printer:", e);
      }
      onPrinterConnected(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-zinc-50 p-6 border border-zinc-100">
        <div className="flex items-center gap-4 mb-4">
          <div className={cn(
            "rounded-2xl p-3",
            connectedPrinter ? "bg-emerald-100 text-emerald-600" : "bg-zinc-200 text-zinc-500"
          )}>
            <Printer size={24} />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900">
              {connectedPrinter ? connectedPrinter.productName || "Thermal Printer" : "No Printer Connected"}
            </h3>
            <p className="text-xs text-zinc-500">
              {connectedPrinter ? "Ready to print invoices" : "Connect via USB OTG cable"}
            </p>
          </div>
        </div>

        {connectedPrinter ? (
          <button
            onClick={disconnectPrinter}
            className="w-full rounded-2xl bg-rose-50 py-3 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100"
          >
            Disconnect Printer
          </button>
        ) : (
          <button
            onClick={connectPrinter}
            disabled={!isSupported}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white shadow-lg transition-transform active:scale-95",
              isSupported ? "bg-emerald-600 shadow-emerald-100" : "bg-zinc-400 cursor-not-allowed"
            )}
          >
            <Usb size={20} />
            Connect USB Printer
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-rose-700">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-xs font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Info size={14} />
          How to connect via OTG
        </h4>
        <div className="grid gap-3">
          {[
            "Connect your Thermal Printer to your phone using a USB OTG adapter.",
            "IMPORTANT: Go to your phone's Settings and ensure 'OTG Connection' or 'USB Debugging' is turned ON (especially on Oppo, Vivo, Realme, OnePlus).",
            "Turn on the printer and ensure it has paper.",
            "Click 'Connect USB Printer' above and select your printer from the list.",
            "Grant permission to access the USB device when prompted."
          ].map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-600">
                {i + 1}
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
