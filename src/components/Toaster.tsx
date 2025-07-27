"use client";
import * as React from "react";
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastAction } from "@radix-ui/react-toast";

const DemoToastContext = React.createContext<(() => void) | undefined>(undefined);

export function useDemoToast() {
  const ctx = React.useContext(DemoToastContext);
  if (!ctx) throw new Error("useDemoToast must be used within Toaster");
  return ctx;
}

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const showDemoToast = React.useCallback(() => setOpen(true), []);
  return (
    <DemoToastContext.Provider value={showDemoToast}>
      <ToastProvider swipeDirection="right">
        <Toast open={open} onOpenChange={setOpen} className="bg-white/10 border border-white/20 text-white rounded-lg shadow-lg px-4 py-3 backdrop-blur-xl">
          <ToastTitle className="font-bold">Sukces!</ToastTitle>
          <ToastDescription>To jest przykładowe powiadomienie demo.</ToastDescription>
          <ToastAction altText="Zamknij">Zamknij</ToastAction>
        </Toast>
        <ToastViewport className="fixed bottom-4 right-4 z-50 w-96 max-w-full outline-none" />
        {children}
      </ToastProvider>
    </DemoToastContext.Provider>
  );
}
export default Toaster; 