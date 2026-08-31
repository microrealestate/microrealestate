import { FieldArray } from 'formik';
import _ from 'lodash';
import { LuCirclePlus, LuX } from 'react-icons/lu';
import { cn } from '../../utils';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';

export enum ArrayFieldDisplay {
  FRAMED = 'framed',
  FRAMELESS = 'frameless'
}

export function ArrayField({
  name,
  addLabel,
  items,
  emptyItem,
  renderTitle,
  renderContent,
  readOnly,
  singleItemDisplay = ArrayFieldDisplay.FRAMELESS
}: {
  name: string;
  addLabel?: string;
  items?: (Record<string, unknown> & { key: string })[];
  emptyItem?: unknown;
  renderTitle?: (item: unknown, index: number) => React.ReactNode;
  renderContent?: (item: unknown, index: number) => React.ReactNode;
  readOnly?: boolean | ((item: unknown, index: number) => boolean);
  singleItemDisplay?: ArrayFieldDisplay;
}) {
  const cyLabel = `${_.upperFirst(name)}Item`;
  const isMultiple = items?.length && items.length > 1;
  const isReadOnly = readOnly === true;

  const isItemReadOnly = (item: unknown, index: number) => {
    if (isReadOnly) {
      return true;
    }
    if (typeof readOnly === 'function') {
      return readOnly(item, index);
    }
    return false;
  };

  if (isReadOnly) {
    const isSingleItem = items?.length === 1;
    return (
      <div className="space-y-4">
        {items?.map((item, index) => (
          <div key={item.key} className="py-2">
            {renderTitle && !isSingleItem ? (
              <div className="font-medium text-sm mb-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md">
                {renderTitle(item, index)}
              </div>
            ) : null}
            <div className={cn('text-sm', !isSingleItem ? 'px-2' : '')}>
              {renderContent?.(item, index)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <FieldArray
      name={name}
      render={(arrayHelpers) => (
        <div className="space-y-4">
          {items?.map((item, index) => {
            const showCard =
              isMultiple ||
              index > 0 ||
              singleItemDisplay === ArrayFieldDisplay.FRAMED;
            return showCard ? (
              <Card key={item.key} className="pt-0">
                <CardHeader className="bg-muted py-2 flex flex-row items-center justify-between">
                  <div>{renderTitle?.(item, index)}</div>
                  {!isItemReadOnly(item, index) ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        arrayHelpers.remove(index);
                      }}
                      data-cy={`remove${cyLabel}${index}`}
                    >
                      <LuX className="size-4" />
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderContent?.(item, index)}
                </CardContent>
              </Card>
            ) : (
              <div key={item.key}>{renderContent?.(item, index)}</div>
            );
          })}
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                arrayHelpers.push(emptyItem);
              }}
              className="gap-1"
              data-cy={`add${cyLabel}`}
            >
              <LuCirclePlus className="size-4" />
              {addLabel}
            </Button>
          </div>
        </div>
      )}
    />
  );
}
