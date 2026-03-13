import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { toast } from 'sonner';

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

const DEFAULT_UTILITY_CATEGORIES = [
  'internet',
  'insurance',
  'gas',
  'water',
  'sewer',
  'power',
  'trash',
  'hoa',
  'landscaping',
  'other'
];

const CATEGORY_STORAGE_KEY_PREFIX = 'utilities-category-settings:';

function normalizeCategory(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function UtilityCategorySettings() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customCategories, setCustomCategories] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [loadedCategorySettings, setLoadedCategorySettings] = useState(false);

  const organizationSlug = String(router.query.organization || 'default');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storageKey = `${CATEGORY_STORAGE_KEY_PREFIX}${organizationSlug}`;

    try {
      const storedValue = window.localStorage.getItem(storageKey);
      if (!storedValue) {
        setCustomCategories([]);
        setHiddenCategories([]);
        return;
      }

      const parsedValue = JSON.parse(storedValue);

      setCustomCategories(
        Array.isArray(parsedValue?.custom)
          ? parsedValue.custom
              .map((category) => normalizeCategory(category))
              .filter(Boolean)
          : []
      );
      setHiddenCategories(
        Array.isArray(parsedValue?.hidden)
          ? parsedValue.hidden
              .map((category) => normalizeCategory(category))
              .filter(Boolean)
          : []
      );
    } catch (error) {
      setCustomCategories([]);
      setHiddenCategories([]);
    } finally {
      setLoadedCategorySettings(true);
    }
  }, [organizationSlug]);

  useEffect(() => {
    if (typeof window === 'undefined' || !loadedCategorySettings) {
      return;
    }

    const storageKey = `${CATEGORY_STORAGE_KEY_PREFIX}${organizationSlug}`;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ custom: customCategories, hidden: hiddenCategories })
    );
  }, [
    customCategories,
    hiddenCategories,
    loadedCategorySettings,
    organizationSlug
  ]);

  const availableCategories = useMemo(() => {
    const typeSet = new Set();

    DEFAULT_UTILITY_CATEGORIES.forEach((type) => typeSet.add(type));
    customCategories.forEach((type) => {
      const normalizedType = normalizeCategory(type);
      if (normalizedType) {
        typeSet.add(normalizedType);
      }
    });
    hiddenCategories.forEach((type) => {
      typeSet.delete(normalizeCategory(type));
    });

    return Array.from(typeSet).sort((a, b) => a.localeCompare(b));
  }, [customCategories, hiddenCategories]);

  const hiddenCategoryOptions = useMemo(() => {
    return Array.from(new Set(hiddenCategories)).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [hiddenCategories]);

  const handleAddCategory = () => {
    const normalizedCategory = normalizeCategory(newCategoryName);
    if (!normalizedCategory) {
      toast.error(t('Category is required'));
      return;
    }

    setCustomCategories((previous) => {
      if (previous.includes(normalizedCategory)) {
        return previous;
      }

      return [...previous, normalizedCategory];
    });

    setHiddenCategories((previous) =>
      previous.filter((category) => category !== normalizedCategory)
    );
    setNewCategoryName('');
    toast.success(t('Category added'));
  };

  const handleHideCategory = (category) => {
    const normalizedCategory = normalizeCategory(category);

    if (!normalizedCategory) {
      return;
    }

    setHiddenCategories((previous) => {
      if (previous.includes(normalizedCategory)) {
        return previous;
      }

      return [...previous, normalizedCategory];
    });
  };

  const handleRestoreCategory = (category) => {
    const normalizedCategory = normalizeCategory(category);
    setHiddenCategories((previous) =>
      previous.filter((item) => item !== normalizedCategory)
    );
  };

  return (
    <Page dataCy="utilityCategorySettingsPage">
      <Card>
        <CardHeader>
          <CardTitle>{t('Utility categories')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t(
              'Manage which categories appear in Utilities for this organization.'
            )}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="text"
              placeholder={t('New category name')}
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
            />
            <Button type="button" onClick={handleAddCategory}>
              {t('Add category')}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              {t('Available categories')}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableCategories.length ? (
                availableCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleHideCategory(category)}
                    className="px-2 py-1 rounded border text-xs hover:bg-muted"
                    title={t('Remove category from menu')}
                  >
                    {category} x
                  </button>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t('No categories available')}
                </span>
              )}
            </div>
          </div>

          {hiddenCategoryOptions.length ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {t('Removed categories')}
              </div>
              <div className="flex flex-wrap gap-2">
                {hiddenCategoryOptions.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleRestoreCategory(category)}
                    className="px-2 py-1 rounded border text-xs text-muted-foreground hover:bg-muted"
                    title={t('Restore category')}
                  >
                    {category} +
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

export default withAuthentication(UtilityCategorySettings);
