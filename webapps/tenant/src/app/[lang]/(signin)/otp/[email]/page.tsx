'use client';

import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
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
      <Card>
        <CardContent className="pt-8">
          <div className="flex flex-col justify-center">
            <h2 className="text-xl text-center">{t('Verification')}</h2>
            <div className="mt-4 mb-2 text-center">
              {t('Enter the code sent to')}
            </div>
            <div className="font-medium text-center">{email}</div>
            <Form {...form}>
              <form
                className="my-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
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
                          <InputOTPGroup className="justify-center w-full text-xl">
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
            <Button
              variant="link"
              className="mt-2 w-full"
              disabled={loading}
              onClick={() => router.replace('/signin')}
            >
              {t('Back to Sign in page')}
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="text-xs text-secondary-foreground mt-4">
        {t('This code expires shortly, so please check your email soon.')}
        <br />
        {t("If you haven't received the email, check your spam folder.")}
      </div>
    </>
  );
}
