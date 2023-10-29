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
import { cn } from '@/utils';
import config from '@/config';
import useTranslation from '@/utils/i18n/client/useTranslation';

const signInFormSchema = z.object({
  email: z.string().email(),
});

type SignInFormValues = z.infer<typeof signInFormSchema>;

export default function Signin() {
  const { t } = useTranslation();
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: 'john.doe@demo.com',
    },
  });

  async function onSubmit(values: SignInFormValues) {
    window.location.href = `${config.BASE_PATH}/en/dashboard`;
  }

  return (
    <div className={cn('flex flex-col items-center justify-center mt-48')}>
      <div
        className={cn(
          'flex items-center mb-6 text-2xl text-gray-900 dark:text-white font-semibold'
        )}
      >
        <Image
          src={`${config.BASE_PATH}/favicon.svg`}
          alt="Logo"
          width={40}
          height={40}
          className={cn('mr-2')}
        />
        {config.APP_NAME}
      </div>

      <div
        className={cn(
          'w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700'
        )}
      >
        <div className={cn('p-6 space-y-4 md:space-y-6 sm:p-8')}>
          <h1
            className={cn(
              'text-xl  leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white'
            )}
          >
            {t('Sign in to your account')}
          </h1>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className={cn('space-y-4 md:space-y-6')}
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Your email')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    {/* <FormDescription></FormDescription> */}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className={cn(
                  'w-full text-white bg-primary focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary dark:focus:ring-primary-800'
                )}
              >
                Submit
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
