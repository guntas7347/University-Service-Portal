import { useState, ChangeEvent, useCallback, useRef, useEffect } from "react";

type FormFields = Record<string, any>;

export const useForm = <T extends FormFields = {}>(defaultFormFields?: T) => {
  const [form, setFormFields] = useState<T>(defaultFormFields ?? ({} as T));
  const [checkError, setCheckError] = useState(false);

  // Use a ref to store initial values so we don't trigger callback changes
  const defaultFieldsRef = useRef<T | undefined>(defaultFormFields);
  useEffect(() => {
    defaultFieldsRef.current = defaultFormFields;
  }, [defaultFormFields]);

  const handleChange = useCallback((
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  }, []);

  const resetFormFields = useCallback(() => {
    setFormFields(defaultFieldsRef.current ?? ({} as T));
  }, []);

  const setFields = useCallback((obj: Partial<T>) => {
    setFormFields((prev) => ({ ...prev, ...obj }));
  }, []);

  const error: Record<keyof T, boolean> = {} as Record<keyof T, boolean>;
  if (defaultFormFields) {
    (Object.keys(defaultFormFields) as Array<keyof T>).forEach((key) => {
      error[key] = form[key] === defaultFormFields[key];
    });
  }

  return {
    form,
    setFormFields,
    handleChange,
    resetFormFields,
    setFields,
    error,
    checkError,
    setCheckError,
  };
};
