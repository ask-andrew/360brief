import { useForm as useHookForm, UseFormProps, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, ZodType } from 'zod';

type UseFormParams<T extends z.ZodType> = {
  schema: T;
  options?: Omit<UseFormProps<z.infer<T>>, 'resolver'>;
};

export function useForm<T extends ZodType>({ schema, options }: UseFormParams<T>) {
  const form = useHookForm<z.infer<T>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    ...options,
  });

  return {
    ...form,
    formState: {
      ...form.formState,
      // Add any additional form state properties here
    },
  } as UseFormReturn<z.infer<T>>;
}

export function useControlledForm<T extends ZodType>({
  schema,
  defaultValues,
  onSubmit,
}: {
  schema: T;
  defaultValues: z.infer<T>;
  onSubmit: (data: z.infer<T>) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
    ...rest
  } = useForm({
    schema,
    defaultValues,
  });

  const handleFormSubmit = async (data: z.infer<T>) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Handle form submission errors
      if (error instanceof Error) {
        setError('root', {
          type: 'manual',
          message: error.message,
        });
      } else {
        setError('root', {
          type: 'manual',
          message: 'An unknown error occurred',
        });
      }
    }
  };

  return {
    control,
    handleSubmit: handleSubmit(handleFormSubmit),
    errors,
    isSubmitting,
    reset,
    ...rest,
  };
}
