'use client';

import TodoCard from '@microrealestate/commonui/components/TodoCard';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { TODO_TYPE } from '@microrealestate/shared';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { LuCircleUser, LuKeyRound, LuMail } from 'react-icons/lu';
import { RiContractLine } from 'react-icons/ri';
import { toast } from 'sonner';
import Page from '@/components/Page';
import useResourceActions from '@/hooks/useResourceActions';
import { useRouter } from '@/i18n/navigation';
import { fetchTodos, QueryKeys } from '@/utils/restcalls';

export default function Todo() {
  const t = useTranslations('common');
  const router = useRouter();
  const {
    ResourceDialogs,
    handleAddProperty,
    handleAddTenant,
    handleCreateContract
  } = useResourceActions();

  const {
    data: todos,
    isLoading,
    isError
  } = useQuery({
    queryKey: [QueryKeys.TODOS],
    queryFn: fetchTodos,
    refetchOnMount: 'always'
  });

  useEffect(() => {
    if (isError) {
      toast.error(t('Something went wrong'));
    }
  }, [isError, t]);

  const isEmpty = !isLoading && Array.isArray(todos) && todos.length === 0;

  useEffect(() => {
    if (isEmpty) {
      router.replace('/dashboard');
    }
  }, [isEmpty, router]);

  const setupCards = {
    [TODO_TYPE.SETUP_CONTRACT]: {
      icon: <RiContractLine className="size-5" />,
      title: t('Create a contract'),
      description: t(
        'Create a reusable contract model that includes the terms and conditions for renting your properties.'
      ),
      buttonText: t('Create a contract'),
      onClick: handleCreateContract,
      buttonDataCy: 'shortcutCreateContract'
    },
    [TODO_TYPE.SETUP_PROPERTY]: {
      icon: <LuKeyRound className="size-5" />,
      title: t('Add a property'),
      description: t(
        'Enter the details of your property so it can be listed and made available for renting.'
      ),
      buttonText: t('Add a property'),
      onClick: handleAddProperty,
      buttonDataCy: 'shortcutAddProperty'
    },
    [TODO_TYPE.SETUP_TENANT]: {
      icon: <LuCircleUser className="size-5" />,
      title: t('Add a tenant'),
      description: t(
        "Add your tenant's details to link them to the property and contract model, finalizing the lease setup."
      ),
      buttonText: t('Add a tenant'),
      onClick: handleAddTenant,
      buttonDataCy: 'shortcutAddTenant'
    },
    [TODO_TYPE.SETUP_EMAIL]: {
      icon: <LuMail className="size-5" />,
      title: t('Configure the email service'),
      description: t(
        'Connect your mailbox to send rent notices, receipts and invoices, and to allow password reset and tenant sign-in.'
      ),
      buttonText: t('Configure the email service'),
      onClick: () => router.push('/settings/email'),
      buttonDataCy: 'shortcutConfigureEmail'
    }
  };

  return !isEmpty ? (
    <Page dataCy="todoPage" loading={isLoading}>
      <h1 className="text-xl font-semibold mb-1">{t('To do')}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {t('Pending tasks that need your attention.')}
      </p>
      <section className="space-y-4">
        {(todos ?? []).map(({ type, blocked }) => {
          const card = setupCards[type];
          return (
            <TodoCard
              key={type}
              icon={card.icon}
              title={card.title}
              description={card.description}
              dataCy={`todo-${type}`}
            >
              <div className="flex flex-col items-stretch sm:items-end gap-1">
                <Button
                  size="sm"
                  onClick={card.onClick}
                  disabled={blocked}
                  className="w-full sm:w-auto"
                  data-cy={card.buttonDataCy}
                >
                  {card.buttonText}
                </Button>
                {blocked ? (
                  <span className="text-xs text-muted-foreground">
                    {t('Create a contract and a property first')}
                  </span>
                ) : null}
              </div>
            </TodoCard>
          );
        })}
      </section>
      <ResourceDialogs />
    </Page>
  ) : null;
}
