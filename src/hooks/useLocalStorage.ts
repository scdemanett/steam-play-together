import { useState, useEffect, useRef } from 'react';

function useLocalStorage<T>(key: string, initialValue: T, steamId?: string): [T, (value: T) => void] {
  // Create a user-specific key if steamId is provided
  const storageKey = steamId ? `${key}-${steamId}` : key;
  const initialValueRef = useRef(initialValue);
  const prevStorageKeyRef = useRef(storageKey);

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      const item = localStorage.getItem(storageKey);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(`Error loading ${storageKey} from localStorage:`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      localStorage.setItem(storageKey, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error(`Error saving ${storageKey} to localStorage:`, error);
    }
  };

  // Only reload when storageKey actually changes (e.g., different user)
  useEffect(() => {
    if (storageKey !== prevStorageKeyRef.current) {
      prevStorageKeyRef.current = storageKey;
      
      try {
        const item = localStorage.getItem(storageKey);
        if (item) {
          const parsed = JSON.parse(item);
          setStoredValue(parsed);
        } else {
          setStoredValue(initialValueRef.current);
        }
      } catch (error) {
        console.error(`Error parsing ${storageKey} from localStorage:`, error);
        setStoredValue(initialValueRef.current);
      }
    }
  }, [storageKey]);

  return [storedValue, setValue];
}

export default useLocalStorage; 