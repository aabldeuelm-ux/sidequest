"use client";

import { useState, useEffect, useCallback } from "react";
import * as idb from "idb-keyval";

export function useIndexedDB<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const item = await idb.get(key);
        if (isMounted) {
          if (item !== undefined) {
            setStoredValue(item as T);
          }
          setIsLoaded(true);
        }
      } catch (error) {
        console.warn(`Error reading IndexedDB key "${key}":`, error);
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [key]);

  const setValue = useCallback(async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== "undefined") {
        await idb.set(key, valueToStore);
      }
    } catch (error) {
      console.warn(`Error setting IndexedDB key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue, isLoaded];
}
