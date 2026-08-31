import { Card } from '@microrealestate/commonui/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@microrealestate/commonui/components/ui/tabs';
import { useTranslations } from 'next-intl';
import LeaseForm from './LeaseForm';
import TemplateForm from './TemplateForm';

export default function LeaseTabs({ onSubmit }) {
  const t = useTranslations('common');
  return (
    <Tabs defaultValue="contract">
      <TabsList className="flex items-start justify-start h-auto w-auto overflow-x-auto">
        <TabsTrigger
          value="contract"
          className="min-w-48 sm:w-full"
          data-cy="tabContractInfo"
        >
          {t('Contract')}
        </TabsTrigger>
        <TabsTrigger
          value="documents"
          className="min-w-48 sm:w-full"
          data-cy="tabContractTemplates"
        >
          {t('Documents')}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="contract">
        <Card className="p-6">
          <LeaseForm onSubmit={onSubmit} />
        </Card>
      </TabsContent>
      <TabsContent value="documents">
        <Card className="p-6">
          <TemplateForm onSubmit={onSubmit} />
        </Card>
      </TabsContent>
    </Tabs>
  );
}
