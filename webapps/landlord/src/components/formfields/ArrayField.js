import { LuPlusCircle, LuTrash } from 'react-icons/lu';
import _ from 'lodash';
import { Button } from '../ui/button';
import { cn } from '../../utils';
import { FieldArray } from 'formik';

export function ArrayField({
  name,
  addLabel,
  items,
  emptyItem,
  renderTitle,
  renderContent,
  readOnly
}) {
  const cyLabel = `${_.upperFirst(name)}Item`;
  const isMultiple = items?.length > 1;
  const isReadOnly = (item, index) => {
    return (
      readOnly === true ||
      (typeof readOnly === 'function' ? readOnly(item, index) === true : false)
    );
  };

  return (
    <FieldArray
      name={name}
      render={(arrayHelpers) => (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index}>
              <div
                className={cn(
                  !isReadOnly(item, index) && isMultiple
                    ? 'border-2 rounded-sm p-4'
                    : ''
                )}
              >
                {!isReadOnly(item, index) && isMultiple && (
                  <div className="flex justify-between">
                    <span className="text-lg text-muted-foreground">
                      {renderTitle?.(item, index)}
                    </span>
                    <div className="flex justify-end">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          arrayHelpers.remove(index);
                        }}
                        data-cy={`remove${cyLabel}${index}`}
                      >
                        <LuTrash className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {renderContent?.(item, index)}
              </div>
            </div>
          ))}
          {!isReadOnly() && (
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
                <LuPlusCircle className="size-4" />
                {addLabel}
              </Button>
            </div>
          )}
        </div>
      )}
    />
  );
}
