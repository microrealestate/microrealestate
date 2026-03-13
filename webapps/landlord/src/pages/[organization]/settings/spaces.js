import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';

import { withAuthentication } from '../../../components/Authentication';
import Page from '../../../components/Page';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { StoreContext } from '../../../store';
import { useContext } from 'react';
import types from '../../../components/properties/types';

const PROPERTY_TYPE_STORAGE_KEY_PREFIX = 'property-type-settings:';

function normalizeType(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function toTypeLabel(typeId, t) {
  const defaultType = types.find((type) => type.id === typeId);
  if (defaultType) {
    return t(defaultType.labelId);
  }

  return String(typeId)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

function SpaceTypesSettings() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [newTypeName, setNewTypeName] = useState('');
  const [customTypes, setCustomTypes] = useState([]);
  const [hiddenTypes, setHiddenTypes] = useState([]);
  const [loadedSettings, setLoadedSettings] = useState(false);

  const organizationSlug = String(
    store.organization.selected?.name || 'default'
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storageKey = `${PROPERTY_TYPE_STORAGE_KEY_PREFIX}${organizationSlug}`;

    try {
      const storedValue = window.localStorage.getItem(storageKey);
      if (!storedValue) {
        setCustomTypes([]);
        setHiddenTypes([]);
        return;
      }

      const parsedValue = JSON.parse(storedValue);
      setCustomTypes(
        Array.isArray(parsedValue?.custom)
          ? parsedValue.custom
              .map((type) => normalizeType(type))
              .filter(Boolean)
          : []
      );
      setHiddenTypes(
        Array.isArray(parsedValue?.hidden)
          ? parsedValue.hidden
              .map((type) => normalizeType(type))
              .filter(Boolean)
          : []
      );
    } catch (error) {
      setCustomTypes([]);
      setHiddenTypes([]);
    } finally {
      setLoadedSettings(true);
    }
  }, [organizationSlug]);

  useEffect(() => {
    if (typeof window === 'undefined' || !loadedSettings) {
      return;
    }

    const storageKey = `${PROPERTY_TYPE_STORAGE_KEY_PREFIX}${organizationSlug}`;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ custom: customTypes, hidden: hiddenTypes })
    );
  }, [customTypes, hiddenTypes, loadedSettings, organizationSlug]);

  const availableTypes = useMemo(() => {
    const typeSet = new Set(types.map((type) => normalizeType(type.id)));

    customTypes.forEach((type) => {
      const normalizedType = normalizeType(type);
      if (normalizedType) {
        typeSet.add(normalizedType);
      }
    });

    hiddenTypes.forEach((type) => {
      typeSet.delete(normalizeType(type));
    });

    return Array.from(typeSet).sort((a, b) => a.localeCompare(b));
  }, [customTypes, hiddenTypes]);

  const hiddenTypeOptions = useMemo(() => {
    return Array.from(new Set(hiddenTypes)).sort((a, b) => a.localeCompare(b));
  }, [hiddenTypes]);

  const handleAddType = () => {
    const normalizedType = normalizeType(newTypeName);
    if (!normalizedType) {
      toast.error(t('Type is required'));
      return;
    }

    setCustomTypes((previous) => {
      if (previous.includes(normalizedType)) {
        return previous;
      }

      return [...previous, normalizedType];
    });

    setHiddenTypes((previous) =>
      previous.filter((type) => type !== normalizedType)
    );

    setNewTypeName('');
    toast.success(t('Type added'));
  };

  const handleHideType = (type) => {
    const normalizedType = normalizeType(type);
    if (!normalizedType) {
      return;
    }

    setHiddenTypes((previous) => {
      if (previous.includes(normalizedType)) {
        return previous;
      }

      return [...previous, normalizedType];
    });
  };

  const handleRestoreType = (type) => {
    const normalizedType = normalizeType(type);
    setHiddenTypes((previous) =>
      previous.filter((item) => item !== normalizedType)
    );
  };

  return (
    <Page dataCy="spaceTypesSettingsPage">
      <Card>
        <CardHeader>
          <CardTitle>{t('Space types')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t(
              'Manage property space types shown in the Property Type dropdown.'
            )}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="text"
              placeholder={t('New space type')}
              value={newTypeName}
              onChange={(event) => setNewTypeName(event.target.value)}
            />
            <Button type="button" onClick={handleAddType}>
              {t('Add type')}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              {t('Available types')}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTypes.length ? (
                availableTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleHideType(type)}
                    className="px-2 py-1 rounded border text-xs hover:bg-muted"
                    title={t('Remove type from menu')}
                  >
                    {toTypeLabel(type, t)} x
                  </button>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t('No types available')}
                </span>
              )}
            </div>
          </div>

          {hiddenTypeOptions.length ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {t('Removed types')}
              </div>
              <div className="flex flex-wrap gap-2">
                {hiddenTypeOptions.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleRestoreType(type)}
                    className="px-2 py-1 rounded border text-xs text-muted-foreground hover:bg-muted"
                    title={t('Restore type')}
                  >
                    {toTypeLabel(type, t)} +
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Page>
  );
}

export default withAuthentication(SpaceTypesSettings);
