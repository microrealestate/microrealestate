'use client';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import getEnv from '@/utils/env/client';
import { Input } from '@/components/ui/input';
import mockedSession from '@/mocks/session';
import useApiFetcher from '@/utils/fetch/client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import useTranslation from '@/utils/i18n/client/useTranslation';
import { zodResolver } from '@hookform/resolvers/zod';

const signInFormSchema = z.object({
  email: z.string().email()
});
type SignInFormValues = z.infer<typeof signInFormSchema>;

export default function SignIn() {
  const apiFetcher = useApiFetcher();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues:
      getEnv('DEMO_MODE') === 'true'
        ? {
            email: mockedSession.email
          }
        : { email: '' }
  });
  const [loading, setLoading] = useState<boolean>(false);

  async function onSubmit(values: SignInFormValues) {
    if (getEnv('DEMO_MODE') === 'true') {
      router.replace('/dashboard');
    } else {
      try {
        setLoading(true);
        const response = await apiFetcher.post(
          '/api/v2/authenticator/tenant/signin',
          {
            email: values.email
          }
        );
        if (response.status >= 200 && response.status < 300) {
          return router.replace(`/otp/${encodeURIComponent(values.email)}`);
        }
      } catch (error) {
        console.error(error);
      }
      toast({
        variant: 'destructive',
        title: t('Something went wrong'),
        description: t('There was an error while signing in.')
      });
      setLoading(false);
    }
  }

  return (
    <div className="p-5 md:p-0 md:max-w-md w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <div className="text-2xl text-center md:text-left md:text-4xl font-medium text-secondary-foreground">
            {t('Sign in to your account')}
          </div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('Your email')}
                    disabled={getEnv('DEMO_MODE') === 'true' || loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {t('Sign in')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
