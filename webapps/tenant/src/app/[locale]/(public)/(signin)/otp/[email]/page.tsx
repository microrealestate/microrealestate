'use client';

import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '@microrealestate/commonui/components/ui/input-otp';
import { useTranslations } from 'next-intl';
import { use, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { BASE_PATH } from '@/utils/basepath';
import apiClient from '@/utils/fetch/client';

export default function OTP(props: {
  params: Promise<{
    email: string;
  }>;
}) {
  const params = use(props.params);
  const t = useTranslations('common');
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [otpValue, setOtpValue] = useState<string>('');
  const email = decodeURIComponent(params.email);

  async function onSubmit(otp: string) {
    try {
      setLoading(true);
      await new Promise((res) => setTimeout(res, 1000));
      const response = await apiClient.get(
        `/api/v2/authenticator/tenant/signedin?otp=${otp}`
      );
      if (response.status >= 200 && response.status < 300) {
        return window.location.replace(`${BASE_PATH}/`);
      }
    } catch (error) {
      console.error(error);
    }
    setOtpValue('');
    toast.error(t('The code entered is not valid.'));
    setLoading(false);
  }

  return (
    <>
      <div className="space-y-10 text-secondary-foreground">
        <div className="md:max-w-md w-full m-auto space-y-10 px-4">
          <div className="text-2xl md:text-4xl font-medium text-center space-y-4">
            <div>{t('Enter the code sent to')}</div>
            <div className="text-xl font-medium">{email}</div>
          </div>
          <InputOTP
            value={otpValue}
            maxLength={6}
            autoFocus
            onComplete={onSubmit}
            onKeyDown={() => toast.dismiss()}
            onChange={setOtpValue}
            disabled={loading}
            data-cy="otp-form"
          >
            <InputOTPGroup className="justify-center w-full">
              {Array(6)
                .fill(0)
                .map((_, index) => (
                  <InputOTPSlot
                    // biome-ignore lint/suspicious/noArrayIndexKey: order not going to change
                    key={`slot-${index}`}
                    index={index}
                    className="bg-card border-card-foreground/30 size-16 text-4xl"
                  />
                ))}
            </InputOTPGroup>
          </InputOTP>
          <div className="space-y-2">
            <p>
              {t('This code expires shortly, so please check your email soon.')}
            </p>
            <p>
              {t("If you haven't received the email, check your spam folder.")}
            </p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-10 text-center text-muted-foreground w-full">
        <Button
          variant="link"
          className="mt-2 w-full"
          disabled={loading}
          data-cy="otp-back"
          onClick={() => router.replace('/signin')}
        >
          {t('Back to Sign in page')}
        </Button>
      </div>
    </>
  );
}
