import React, { useCallback, useContext, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { LuFilter, LuSearch } from 'react-icons/lu';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../../store';
import { withAuthentication } from '../../../components/Authentication';
import NumberFormat from '../../../components/NumberFormat';
import Page from '../../../components/Page';
import useFillStore from '../../../hooks/useFillStore';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

async function fetchData(store) {
  return await store.project.fetch();
}

function Projects() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fetching] = useFillStore(fetchData, [router]);

  const filteredProjects = store.project.items.filter((project) => {
    // Status filter
    if (statusFilter !== 'all' && project.status !== statusFilter) {
      return false;
    }

    // Text search
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      project.title?.toLowerCase().includes(search) ||
      project.description?.toLowerCase().includes(search) ||
      project.propertyName?.toLowerCase().includes(search)
    );
  });

  const statusColors = {
    planned: 'bg-gray-100 text-gray-800 border-gray-300',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
    completed: 'bg-green-100 text-green-800 border-green-300',
    'on-hold': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300'
  };

  const handleViewProject = useCallback(
    (project) => {
      router.push(`/${router.query.organization}/projects/${project._id}`);
    },
    [router]
  );

  const statusCounts = {
    all: store.project.items.length,
    planned: store.project.items.filter((p) => p.status === 'planned').length,
    'in-progress': store.project.items.filter((p) => p.status === 'in-progress')
      .length,
    completed: store.project.items.filter((p) => p.status === 'completed')
      .length,
    'on-hold': store.project.items.filter((p) => p.status === 'on-hold').length,
    cancelled: store.project.items.filter((p) => p.status === 'cancelled')
      .length
  };

  return (
    <Page loading={fetching} dataCy="projectsPage">
      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('Projects')}</h1>
          <div className="text-sm text-muted-foreground">
            {filteredProjects.length} {t('project(s)')}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('Search projects...')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="all">
                {t('All Status')} ({statusCounts.all})
              </option>
              <option value="planned">
                {t('Planned')} ({statusCounts.planned})
              </option>
              <option value="in-progress">
                {t('In Progress')} ({statusCounts['in-progress']})
              </option>
              <option value="completed">
                {t('Completed')} ({statusCounts.completed})
              </option>
              <option value="on-hold">
                {t('On Hold')} ({statusCounts['on-hold']})
              </option>
              <option value="cancelled">
                {t('Cancelled')} ({statusCounts.cancelled})
              </option>
            </select>
          </div>
        </div>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {store.project.items.length === 0
              ? t('No projects yet')
              : t('No projects match your filters')}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <div
                key={project._id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleViewProject(project)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{project.title}</h3>
                    {project.propertyName && (
                      <div className="text-sm text-muted-foreground mt-1">
                        📍 {project.propertyName}
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      statusColors[project.status] || statusColors.planned
                    }`}
                  >
                    {t(project.status)}
                  </span>
                </div>

                {project.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {project.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm">
                  {project.startDate && (
                    <div>
                      <span className="text-muted-foreground">
                        {t('Start')}:
                      </span>{' '}
                      {new Date(project.startDate).toLocaleDateString()}
                    </div>
                  )}
                  {project.endDate && (
                    <div>
                      <span className="text-muted-foreground">{t('End')}:</span>{' '}
                      {new Date(project.endDate).toLocaleDateString()}
                    </div>
                  )}
                  {(project.estimatedCost || project.actualCost) && (
                    <div>
                      <span className="text-muted-foreground">
                        {t('Cost')}:
                      </span>{' '}
                      {project.actualCost ? (
                        <>
                          <NumberFormat value={project.actualCost} />
                          {project.costCurrency || ''}
                        </>
                      ) : (
                        <>
                          <NumberFormat value={project.estimatedCost} />
                          {project.costCurrency || ''} ({t('est.')})
                        </>
                      )}
                    </div>
                  )}
                  {project.contractorName && (
                    <div>
                      <span className="text-muted-foreground">
                        {t('Contractor')}:
                      </span>{' '}
                      {project.contractorName}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Page>
  );
}

export default withAuthentication(observer(Projects));
