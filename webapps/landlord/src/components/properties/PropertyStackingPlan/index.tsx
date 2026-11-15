import { Card } from '@microrealestate/commonui/components/ui/card';
import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import { EmptyIllustration } from '@/components/Illustrations';
import { NOT_FOR_RENT, STATUS_CLASSES, type Unit } from '../composition';
import { type Block, stackingPlan } from '../stackingPlan';
import { BlockContent, GroupHeader } from './Group';
import { useStatusLabel } from './shared';

function Legend() {
  const statusLabel = useStatusLabel();
  return (
    <ul className="flex flex-wrap gap-4 text-sm text-muted-foreground">
      {['occupied', 'vacant', NOT_FOR_RENT].map((status) => (
        <li key={status} className="flex items-center gap-2">
          <span
            className={cn('size-4 rounded-sm border', STATUS_CLASSES[status])}
            aria-hidden="true"
          />
          {statusLabel(status)}
        </li>
      ))}
    </ul>
  );
}

export default function PropertyStackingPlan({
  data = [],
  matches
}: {
  data?: Unit[];
  matches?: Set<string>;
}) {
  const t = useTranslations('common');
  const { cards, others } = stackingPlan(data, matches);
  const othersCard: Block | undefined = others.length
    ? {
        kind: 'block',
        key: 'others',
        content: [
          {
            kind: 'row',
            key: 'others',
            items: others.map((unit) => ({ kind: 'tile', unit }))
          }
        ]
      }
    : undefined;

  if (!cards.length && !others.length) {
    return <EmptyIllustration label={t('No properties found')} />;
  }

  return (
    <div className="space-y-4" data-cy="propertyStackingPlan">
      {cards.map((card) => (
        <Card key={card.key} className="space-y-3 p-4">
          <GroupHeader block={card} units={data} as="h2" />
          <BlockContent block={card} units={data} depth={0} />
        </Card>
      ))}
      {othersCard ? (
        <Card className="space-y-3 p-4">
          <GroupHeader block={othersCard} units={data} as="h2" />
          <BlockContent block={othersCard} units={data} depth={0} />
        </Card>
      ) : null}
      <Legend />
    </div>
  );
}
