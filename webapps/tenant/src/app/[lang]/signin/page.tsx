'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useForm } from 'react-hook-form';

import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import config from '@/config';
import useTranslation from '@/utils/i18n/client/useTranslation';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import useApiFetcher from '@/utils/fetch/client';

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
    // defaultValues: {
    //   email: 'john.doe@demo.com',
    // },
  });

  async function onSubmit(values: SignInFormValues) {
    // window.location.href = `${config.BASE_PATH}/en/dashboard`;
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

  return (
    <div className="flex flex-col items-center justify-center mt-16">
      <Image
        src={`${config.BASE_PATH}/favicon.svg`}
        alt="Logo"
        width={40}
        height={40}
        className="mr-2"
      />
      <h1 className="flex items-center text-3xl">{config.APP_NAME}</h1>
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
                        <Input
                          {...field}
                          // disabled
                        />
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
