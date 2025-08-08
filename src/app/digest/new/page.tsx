'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ArrowRight, CheckCircle, Mail, Calendar, Clock, Zap, Sun, Moon, Coffee, Loader2 } from 'lucide-react';
import { isDevSession } from '@/lib/dev-auth';
import { createDigestSchedule } from '@/lib/services/digestService';
import { useToast } from '@/components/ui/use-toast';

// Form values type
type FormValues = {
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'weekdays';
  time: string;
  timezone: string;
  includeEmails: boolean;
  includeCalendar: boolean;
  summaryLength: 'brief' | 'detailed' | 'comprehensive';
};

// Form schema with defaults
const defaultValues: FormValues = {
  name: '',
  description: '',
  frequency: 'daily',
  time: '09:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  includeEmails: true,
  includeCalendar: true,
  summaryLength: 'brief',
};

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  frequency: z.enum(['daily', 'weekly', 'weekdays']),
  time: z.string(),
  timezone: z.string(),
  includeEmails: z.boolean(),
  includeCalendar: z.boolean(),
  summaryLength: z.enum(['brief', 'detailed', 'comprehensive']),
});

// Infer the schema type for form handling
type FormSchema = z.infer<typeof formSchema>;

export default function NewDigestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get user ID from session (in a real app, this would come from auth context)
  const getUserId = () => {
    // For now, return a placeholder user ID
    return 'dev-user-123';
  };

  // Generate default digest name with user's first name
  const getDefaultDigestName = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const dateString = now.toLocaleDateString('en-US', options);
    // In a real app, you would get the user's first name from the auth context
    const userName = 'Andrew'; // TODO: Get from auth context
    return `${userName}'s 360Brief for ${dateString}`;
  };

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      name: getDefaultDigestName(),
    },
  });

  const watchFrequency = form.watch('frequency');
  const watchIncludeEmails = form.watch('includeEmails');
  const watchIncludeCalendar = form.watch('includeCalendar');

  const onSubmit = async (data: FormSchema) => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = getUserId();
      
      // Save digest schedule to the database
      const savedDigest = await createDigestSchedule({
        name: data.name,
        description: data.description,
        frequency: data.frequency,
        time: data.time,
        timezone: data.timezone,
        includeEmails: data.includeEmails,
        includeCalendar: data.includeCalendar,
        summaryLength: data.summaryLength,
        userId
      });
      
      // Show success message
      toast({
        title: 'Digest created successfully!',
        description: `Your digest "${data.name}" has been scheduled.`,
      });
      
      // Redirect to success page with digest details
      const params = new URLSearchParams({
        id: savedDigest.id,
        name: encodeURIComponent(data.name),
        time: data.time,
        frequency: data.frequency
      });
      
      router.push(`/digest/new/success?${params.toString()}`);
    } catch (error) {
      console.error('Error creating digest:', error);
      toast({
        title: 'Error creating digest',
        description: 'There was an error saving your digest. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  // If not in dev session, redirect to login
  useEffect(() => {
    if (typeof window !== 'undefined' && !isDevSession()) {
      router.push('/dev/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }
  
  if (typeof window !== 'undefined' && !isDevSession()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > stepNumber ? <CheckCircle className="w-5 h-5" /> : stepNumber}
                </div>
                <span className="mt-2 text-sm font-medium text-gray-700">
                  {stepNumber === 1 ? 'Source' : stepNumber === 2 ? 'Schedule' : 'Content'}
                </span>
              </div>
            ))}
            <div className="flex-1 h-1 bg-gray-200 mx-2"></div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {step === 1 ? 'Create New Digest' : step === 2 ? 'Set Schedule' : 'Customize Content'}
          </h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Step 1: Source */}
              {step === 1 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Digest Name</FormLabel>
                          <button
                            type="button"
                            onClick={() => field.onChange(getDefaultDigestName())}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Reset to default
                          </button>
                        </div>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Morning Briefing" 
                            {...field} 
                            className="font-medium text-gray-900"
                          />
                        </FormControl>
                        <FormDescription className="flex items-center">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {field.value || 'Default name will be used if left empty'}
                          </span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Daily summary of important emails and meetings" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Schedule */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="weekdays">Weekdays</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => {
                        const timeValue = field.value;
                        const [hours, minutes] = timeValue.split(':').map(Number);
                        const time = new Date();
                        time.setHours(hours, minutes);
                        
                        const timeOptions = [
                          { value: '07:00', label: '7:00 AM', icon: <Sun className="h-4 w-4" /> },
                          { value: '09:00', label: '9:00 AM', icon: <Coffee className="h-4 w-4" /> },
                          { value: '12:00', label: '12:00 PM', icon: <Sun className="h-4 w-4" /> },
                          { value: '17:00', label: '5:00 PM', icon: <Moon className="h-4 w-4" /> },
                        ];
                        
                        return (
                          <FormItem>
                            <FormLabel>Time</FormLabel>
                            <div className="grid grid-cols-4 gap-2">
                              {timeOptions.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
                                    field.value === option.value 
                                      ? 'border-blue-500 bg-blue-50' 
                                      : 'border-gray-200 hover:bg-gray-50'
                                  }`}
                                  onClick={() => field.onChange(option.value)}
                                >
                                  <span className="text-gray-500 mb-1">{option.icon}</span>
                                  <span className="text-sm font-medium">{option.label}</span>
                                </button>
                              ))}
                            </div>
                            <div className="mt-3">
                              <FormLabel className="text-sm text-muted-foreground">
                                Or specify custom time:
                              </FormLabel>
                              <Input 
                                type="time" 
                                value={field.value} 
                                onChange={field.onChange}
                                className="mt-1"
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                      <div>
                        <h4 className="font-medium text-blue-900">Digest Schedule</h4>
                        <p className="text-sm text-blue-700">
                          {watchFrequency === 'daily' && 'Every day at '}
                          {watchFrequency === 'weekly' && 'Every Monday at '}
                          {watchFrequency === 'weekdays' && 'Every weekday at '}
                          {form.getValues('time')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Content */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Content Sources</h3>
                    
                    <FormField
                      control={form.control}
                      name="includeEmails"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              <div className="flex items-center">
                                <Mail className="h-5 w-5 mr-2 text-gray-700" />
                                Include Emails
                              </div>
                            </FormLabel>
                            <FormDescription>
                              Get a summary of important emails
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="includeCalendar"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              <div className="flex items-center">
                                <Calendar className="h-5 w-5 mr-2 text-gray-700" />
                                Include Calendar Events
                              </div>
                            </FormLabel>
                            <FormDescription>
                              Include your upcoming meetings and events
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {(watchIncludeEmails || watchIncludeCalendar) && (
                    <div className="pt-4">
                      <h3 className="text-lg font-medium mb-4">Content Preferences</h3>
                      
                      <FormField
                        control={form.control}
                        name="summaryLength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Summary Detail Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select detail level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="brief">Brief (Key Points Only)</SelectItem>
                                <SelectItem value="detailed">Detailed (Main Points)</SelectItem>
                                <SelectItem value="comprehensive">Comprehensive (Full Details)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {step === 1 ? 'Cancel' : 'Back'}
                </Button>
                
                <Button type="submit" disabled={isSubmitting}>
                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {step === 3 ? 'Creating...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        {step === 3 ? 'Create Digest' : 'Continue'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
