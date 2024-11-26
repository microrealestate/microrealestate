import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Card } from '../../ui/card';
import LeaseForm from './LeaseForm';
import TemplateForm from './TemplateForm';
import useTranslation from 'next-translate/useTranslation';

export default function LeaseTabs({ onSubmit }) {
  const { t } = useTranslation('common');
  return (
    <Tabs defaultValue="contract">
      <TabsList className="flex justify-start w-screen-nomargin-sm sm:w-full overflow-x-auto overflow-y-hidden">
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
