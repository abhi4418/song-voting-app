"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "rgba(255, 255, 255, 0.98)",
          "--normal-text": "rgb(15, 23, 42)",
          "--normal-border": "rgb(226, 232, 240)",
          "--success-bg": "rgb(236, 253, 245)",
          "--success-text": "rgb(22, 101, 52)",
          "--success-border": "rgb(167, 243, 208)",
          "--error-bg": "rgb(255, 241, 242)",
          "--error-text": "rgb(159, 18, 57)",
          "--error-border": "rgb(254, 205, 211)",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !shadow-[0_18px_40px_rgba(15,23,42,0.12)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
