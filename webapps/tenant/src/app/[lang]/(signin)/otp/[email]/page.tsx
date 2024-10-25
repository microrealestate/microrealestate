'use client';

import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import getEnv from '@/utils/env/client';
import useApiFetcher from '@/utils/fetch/client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import useTranslation from '@/utils/i18n/client/useTranslation';
import { zodResolver } from '@hookform/resolvers/zod';

const otpFormSchema = z.object({
  otp: z.string().min(6)
});
type OTPFormValues = z.infer<typeof otpFormSchema>;

export default function OTP({
  params
}: {
  params: {
    email: string;
  };
}) {
  const { t } = useTranslation();
  const form = useForm<OTPFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { otp: '' }
  });
  const { toast, dismiss } = useToast();
  const apiFetcher = useApiFetcher();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const email = decodeURIComponent(params.email);

  async function onSubmit(values: OTPFormValues) {
    try {
      setLoading(true);
      await new Promise((res) => setTimeout(res, 1000));
      const response = await apiFetcher.get(
        `/api/v2/authenticator/tenant/signedin?otp=${values.otp}`
      );
      if (response.status >= 200 && response.status < 300) {
        return window.location.replace(`${getEnv('BASE_PATH')}/dashboard`);
      }
    } catch (error) {
      console.error(error);
    }
    toast({
      variant: 'destructive',
      title: t('Invalid code'),
      description: t('The code entered is not valid.')
    });
    form.reset();
    setLoading(false);
  }

  return (
    <>
      <div className="p-5 md:p-0 md:max-w-md w-full">
        <Form {...form}>
          <form
            className="space-y-10"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="text-2xl text-center md:text-4xl font-medium text-secondary-foreground">
              <div>{t('Verification')}</div>
              {t('Enter the code sent to')}
            </div>
            <div className="text-xl text-center font-medium">{email}</div>

            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputOTP
                      maxLength={6}
                      {...field}
                      onComplete={form.handleSubmit(onSubmit)}
                      onKeyDown={() => dismiss()}
                      disabled={loading}
                    >
                      <InputOTPGroup className="justify-center w-full">
                        {Array(6)
                          .fill(0)
                          .map((_, index) => (
                            <InputOTPSlot
                              key={`slot-${index}`}
                              index={index}
                              className="bg-card border-card-foreground/30 size-16 text-4xl"
                            />
                          ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-secondary-foreground">
              {t('This code expires shortly, so please check your email soon.')}
              <br />
              {t("If you haven't received the email, check your spam folder.")}
            </div>
          </form>
        </Form>
      </div>
      <div className="mt-10 lg:mt-0 lg:absolute lg:bottom-10 text-center text-muted-foreground w-full">
        <Button
          variant="link"
          className="mt-2 w-full"
          disabled={loading}
          onClick={() => router.replace('/signin')}
        >
          {t('Back to Sign in page')}
        </Button>
      </div>
    </>
  );
}
