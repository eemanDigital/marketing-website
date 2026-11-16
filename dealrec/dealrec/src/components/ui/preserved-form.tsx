"use client";

import { startTransition, type ComponentPropsWithRef, type SubmitEvent } from "react";

type PreservedFormProps = Omit<ComponentPropsWithRef<"form">, "action"> & {
  action: (formData: FormData) => void | Promise<void>;
};

export function PreservedForm({ action, onSubmit, ...props }: PreservedFormProps) {
  function submit(event: SubmitEvent<HTMLFormElement>) {
    onSubmit?.(event);
    if (event.defaultPrevented) return;

    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      void action(formData);
    });
  }

  return <form {...props} onSubmit={submit} />;
}
