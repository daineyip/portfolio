'use client';

import { createContext, useContext } from 'react';

/** Gives nested app templates their owning window id without prop-drilling. */
const WindowContext = createContext<string | null>(null);

export const WindowProvider = WindowContext.Provider;

export function useWindow(): string {
  const id = useContext(WindowContext);
  if (!id) throw new Error('useWindow must be used inside a WindowProvider');
  return id;
}
