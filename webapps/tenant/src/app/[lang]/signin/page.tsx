'use client';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import getEnv from '@/utils/env/client';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import mockedSession from '@/mocks/session';
import useApiFetcher from '@/utils/fetch/client';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import useTranslation from '@/utils/i18n/client/useTranslation';
import { zodResolver } from '@hookform/resolvers/zod';

const signInFormSchema = z.object({
  email: z.string().email(),
});

type SignInFormValues = z.infer<typeof signInFormSchema>;

export default function Signin() {
  const apiFetcher = useApiFetcher();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showMagicLinkSent, setShowMagicLinkSent] = useState(false);
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: getEnv('DEMO_MODE') === 'true'
      ? {
          email: mockedSession.email,
        }
      : undefined,
  });
  const BASE_PATH = getEnv('BASE_PATH') || '';

  async function onSubmit(values: SignInFormValues) {
    if (getEnv('DEMO_MODE') === 'true') {
      window.location.href = `${BASE_PATH}/en/dashboard`;
    } else {
      try {
        const response = await apiFetcher.post(
          '/api/v2/authenticator/tenant/signin',
          {
            email: values.email,
          }
        );
        if (response.status >= 200 && response.status < 300) {
          return setShowMagicLinkSent(true);
        }
      } catch (error) {
        console.error(error);
      }
      toast({
        variant: 'destructive',
        title: t('Something went wrong'),
        description: t('There was an error while signing in.'),
      });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center mt-16">
      <Image
        src={`${BASE_PATH}/favicon.svg`}
        alt="Logo"
        width={40}
        height={40}
        className="mr-2"
      />
      <h1 className="flex items-center text-3xl">{getEnv('APP_NAME') || ''}</h1>
      <p className="text-sm mt-1 mb-8">{t('for tenants')}</p>

      <Card className="p-6 sm:p-8 w-[32rem]">
        {showMagicLinkSent ? (
          <>
            <h2 className="text-xl">
              {t('Check you received a link by email')}
            </h2>
            <div className="mt-4 mb-2">
              {t('We just sent a sign in link at')}
            </div>
            <div className="font-semibold">{form.getValues('email')}</div>
            <div className="my-2">
              {t('This link expires shortly, so please check your email soon.')}
            </div>
            <Button
              onClick={() => setShowMagicLinkSent(false)}
              className="mt-4 mb-2 w-full"
            >
              {t('Back to Sign in page')}
            </Button>
            <div className="text-xs text-secondary-foreground text-center">
              {t("If you haven't received the email, check your spam folder.")}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl mb-2">{t('Sign in to your account')}</h2>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 md:space-y-6"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Your email')}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={getEnv('DEMO_MODE') === 'true'} />
                      </FormControl>
                      {/* <FormDescription></FormDescription> */}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  {t('Sign in with an email')}
                </Button>
              </form>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
}
