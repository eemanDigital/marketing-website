"use client";

import type { TemplateField } from "@/lib/templates";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

export function TemplateFieldInput({
  field,
  error,
  defaultValue,
}: {
  field: TemplateField;
  error?: string;
  defaultValue?: string;
}) {
  if (field.type === "textarea") {
    return (
      <Field label={field.label} htmlFor={field.key} hint={field.help} error={error} required={field.required}>
        <Textarea
          id={field.key}
          name={field.key}
          placeholder={field.placeholder}
          defaultValue={defaultValue}
          required={field.required}
          maxLength={5000}
        />
      </Field>
    );
  }

  if (field.type === "select") {
    return (
      <Field label={field.label} htmlFor={field.key} hint={field.help} error={error} required={field.required}>
        <Select id={field.key} name={field.key} required={field.required} defaultValue={defaultValue ?? ""}>
          <option value="" disabled>
            Select an option
          </option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Field>
    );
  }

  const inputMode =
    field.type === "currency" ? "decimal" : field.type === "number" ? "numeric" : undefined;

  return (
    <Field label={field.label} htmlFor={field.key} hint={field.help} error={error} required={field.required}>
      <Input
        id={field.key}
        name={field.key}
        type={field.type === "date" ? "date" : "text"}
        inputMode={inputMode}
        placeholder={field.placeholder}
        defaultValue={defaultValue}
        required={field.required}
        maxLength={5000}
      />
    </Field>
  );
}
