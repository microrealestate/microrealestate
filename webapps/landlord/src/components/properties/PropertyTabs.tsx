import { Card } from '@microrealestate/commonui/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@microrealestate/commonui/components/ui/tabs';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { hasStructure, type Unit } from './composition';
import PropertyDetailsForm from './PropertyDetailsForm';
import PropertyForm from './PropertyForm';
import PropertyStructure from './PropertyStructure';

type OnSubmit = (propertyPart: Record<string, unknown>) => Promise<unknown>;

type PropertyTabsProps = {
  onSubmitInformation: OnSubmit;
  onSubmitDetails: OnSubmit;
};

const PropertyTabs = observer(function PropertyTabs({
  onSubmitInformation,
  onSubmitDetails
}: PropertyTabsProps) {
  const t = useTranslations('common');
  const store = useStore();
  const [tab, setTab] = useState('property');

  const selected = store.property.selected as Unit;

  const withStructure = hasStructure(selected, store.property.items);
  // a type change can remove the Structure tab while it is open
  const activeTab = !withStructure && tab === 'structure' ? 'property' : tab;

  return (
    <Tabs value={activeTab} onValueChange={setTab} className="md:col-span-2">
      <TabsList className="flex items-start justify-start h-auto w-auto overflow-x-auto">
        <TabsTrigger
          value="property"
          className="min-w-48 sm:w-full"
          data-cy="tabInformation"
        >
          {t('Information')}
        </TabsTrigger>
        <TabsTrigger
          value="details"
          className="min-w-48 sm:w-full"
          data-cy="tabDetails"
        >
          {t('Details')}
        </TabsTrigger>
        {withStructure ? (
          <TabsTrigger
            value="structure"
            className="min-w-48 sm:w-full"
            data-cy="tabStructure"
          >
            {t('Structure')}
          </TabsTrigger>
        ) : null}
      </TabsList>
      <TabsContent value="property">
        <Card className="p-6">
          <PropertyForm key={selected._id} onSubmit={onSubmitInformation} />
        </Card>
      </TabsContent>
      <TabsContent value="details">
        <Card className="p-6">
          <PropertyDetailsForm key={selected._id} onSubmit={onSubmitDetails} />
        </Card>
      </TabsContent>
      {withStructure ? (
        <TabsContent value="structure">
          <Card className="p-6">
            <PropertyStructure key={selected._id} />
          </Card>
        </TabsContent>
      ) : null}
    </Tabs>
  );
});

export default PropertyTabs;
