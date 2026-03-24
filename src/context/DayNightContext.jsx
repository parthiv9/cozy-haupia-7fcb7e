import { createContext, useContext } from 'react';

const DayNightContext = createContext({ isNight: false });

export function DayNightProvider({ isNight, children }) {
  return (
    <DayNightContext.Provider value={{ isNight }}>{children}</DayNightContext.Provider>
  );
}

export function useDayNight() {
  return useContext(DayNightContext);
}
