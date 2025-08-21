import { useForm as useHookForm, UseFormProps, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, ZodTypeAny } from 'zod';

type UseFormParams<TSchema extends ZodTypeAny> = {
  schema: TSchema;
  options?: Omit<UseFormProps<any>, 'resolver'>;
};

export function useForm<TSchema extends ZodTypeAny>({ schema, options }: UseFormParams<TSchema>) {
  const form = useHookForm<any>({
    resolver: zodResolver(schema as any) as any,
    mode: 'onChange',
    ...(options as any),
  });

  return {
    ...form,
    formState: {
      ...form.formState,
      // Add any additional form state properties here
    },
  } as UseFormReturn<any>;
}

export function useControlledForm<TSchema extends ZodTypeAny>({
  schema,
  defaultValues,
  onSubmit,
}: {
  schema: TSchema;
  defaultValues: z.infer<TSchema>;
  onSubmit: (data: z.infer<TSchema>) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
    ...rest
  } = useForm<TSchema>({
    schema,
    options: { defaultValues: defaultValues as any },
  });

  const handleFormSubmit = async (data: any) => {
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
