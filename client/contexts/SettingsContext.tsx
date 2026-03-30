import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type VolumeBoost = "1x" | "2x" | "3x" | "5x" | "7x" | "10x" | "auto";

interface SettingsContextType {
  volumeBoost: VolumeBoost;
  setVolumeBoost: (boost: VolumeBoost) => Promise<void>;
  getVolumeMultiplier: () => number;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [volumeBoost, setVolumeBoostState] = useState<VolumeBoost>("auto");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedBoost = await AsyncStorage.getItem("@volume_boost");
      if (savedBoost === "1x" || savedBoost === "2x" || savedBoost === "3x" || 
          savedBoost === "5x" || savedBoost === "7x" || savedBoost === "10x" || savedBoost === "auto") {
        setVolumeBoostState(savedBoost as VolumeBoost);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const setVolumeBoost = async (boost: VolumeBoost) => {
    try {
      await AsyncStorage.setItem("@volume_boost", boost);
      setVolumeBoostState(boost);
    } catch (error) {
      console.error("Error saving volume boost:", error);
    }
  };

  const getVolumeMultiplier = (): number => {
    switch (volumeBoost) {
      case "1x":
        return 1.0;
      case "2x":
        return 2.0;
      case "3x":
        return 3.0;
      case "5x":
        return 5.0;
      case "7x":
        return 7.0;
      case "10x":
        return 10.0;
      case "auto":
        return 1.5;
      default:
        return 1.0;
    }
  };

  return (
    <SettingsContext.Provider value={{ volumeBoost, setVolumeBoost, getVolumeMultiplier }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
