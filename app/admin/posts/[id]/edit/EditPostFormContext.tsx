'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';

type EditPostFormContextValue = {
  newFilesRef: React.MutableRefObject<File[]>;
};

const EditPostFormContext = createContext<EditPostFormContextValue | null>(null);

export function useEditPostFormContext() {
  return useContext(EditPostFormContext);
}

export function EditPostFormProvider({
  newFilesRef,
  children,
}: {
  newFilesRef: React.MutableRefObject<File[]>;
  children: ReactNode;
}) {
  return (
    <EditPostFormContext.Provider value={{ newFilesRef }}>
      {children}
    </EditPostFormContext.Provider>
  );
}
