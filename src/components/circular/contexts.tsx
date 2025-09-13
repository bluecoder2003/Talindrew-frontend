import React, { createContext, useContext, useState, ReactNode } from 'react';

// Context for managing central index rotation
export interface CentralIndexContextType {
  circular: number;
  setCentralIndex: (viewer: string, index: number) => void;
}

export const CentralIndexContext = createContext<CentralIndexContextType>({
  circular: 0,
  setCentralIndex: () => {},
});

// Context for selection management
export interface SelectionContextType {
  clockwise?: boolean;
  end?: number;
  ref?: string;
  start?: number;
}

export const SelectionContext = createContext<SelectionContextType>({});

// Provider components
export const CentralIndexProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [circular, setCircular] = useState(0);

  const setCentralIndex = (viewer: string, index: number) => {
    if (viewer === 'CIRCULAR') {
      setCircular(index);
    }
  };

  return (
    <CentralIndexContext.Provider value={{ circular, setCentralIndex }}>
      {children}
    </CentralIndexContext.Provider>
  );
};

export const SelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [start, setStart] = useState<number | undefined>(undefined);
  const [end, setEnd] = useState<number | undefined>(undefined);
  const [clockwise, setClockwise] = useState<boolean | undefined>(undefined);
  const [ref, setRef] = useState<string | undefined>(undefined);

  return (
    <SelectionContext.Provider value={{ start, end, clockwise, ref }}>
      {children}
    </SelectionContext.Provider>
  );
};

// Hooks
export const useCentralIndex = () => {
  return useContext(CentralIndexContext);
};

export const useSelection = () => {
  return useContext(SelectionContext);
};