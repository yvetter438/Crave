import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ActivePostContextType {
  activePostId: string | null;
  setActivePostId: (id: string | null) => void;
}

const ActivePostContext = createContext<ActivePostContextType | undefined>(undefined);

export const ActivePostProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activePostId, setActivePostId] = useState<string | null>(null);

  return (
    <ActivePostContext.Provider value={{ activePostId, setActivePostId }}>
      {children}
    </ActivePostContext.Provider>
  );
};

export const useActivePost = (): ActivePostContextType => {
  const context = useContext(ActivePostContext);
  if (!context) {
    throw new Error('useActivePost must be used within an ActivePostProvider');
  }
  return context;
};
