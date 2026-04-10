/**
 * Loading and Empty State Components - Usage Examples
 * 
 * This file demonstrates how to use the loading state components
 * (Spinner, Skeleton, ProgressBar) and EmptyState component.
 */

import { Spinner } from './Spinner';
import { Skeleton, SkeletonGroup } from './Skeleton';
import { ProgressBar, IndeterminateProgress } from './ProgressBar';
import { EmptyState } from './EmptyState';
import { FileQuestion, AlertCircle } from 'lucide-react';
import { useTranslation } from "../../i18n";

export const LoadingStatesExamples = () => {
    const { tx } = useTranslation();
  return (
    <div className="space-y-12 p-8">
      {/* Spinner Examples */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">{tx('ui.spinner')}</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">{tx('ui.sizes')}</h3>
            <div className="flex items-center gap-4">
              <Spinner size="xs" />
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
              <Spinner size="xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Skeleton Examples */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">{tx('ui.skeleton')}</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">{tx('ui.text_skeleton')}</h3>
            <Skeleton variant="text" width="200px" />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">{tx('ui.circular_skeleton')}</h3>
            <Skeleton variant="circular" width="60px" height="60px" />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">{tx('ui.rectangular_skeleton')}</h3>
            <Skeleton variant="rectangular" width="100%" height="120px" />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">{tx('ui.skeleton_group')}</h3>
            <SkeletonGroup count={3} spacing={12} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">{tx('ui.card_skeleton')}</h3>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" width="48px" height="48px" />
                <div className="flex-1 space-y-2">
                  <Skeleton width="60%" />
                  <Skeleton width="40%" />
                </div>
              </div>
              <Skeleton variant="rectangular" height="100px" />
              <div className="space-y-2">
                <Skeleton width="100%" />
                <Skeleton width="80%" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ProgressBar Examples */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">{tx('ui.progress_bar')}</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">{tx('ui.basic_progress')}</h3>
            <ProgressBar value={50} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">{tx('ui.with_label')}</h3>
            <ProgressBar value={75} showLabel />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">{tx('ui.custom_label')}</h3>
            <ProgressBar value={60} showLabel label={tx('ui.uploading_files')} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">{tx('ui.sizes')}</h3>
            <div className="space-y-3">
              <ProgressBar value={40} size="sm" />
              <ProgressBar value={60} size="md" />
              <ProgressBar value={80} size="lg" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">{tx('ui.variants')}</h3>
            <div className="space-y-3">
              <ProgressBar value={50} variant="default" showLabel label={tx('ui.default')} />
              <ProgressBar value={100} variant="success" showLabel label={tx('ui.success')} />
              <ProgressBar value={70} variant="warning" showLabel label={tx('ui.warning')} />
              <ProgressBar value={30} variant="error" showLabel label={tx('ui.error')} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">{tx('ui.indeterminate_progress')}</h3>
            <IndeterminateProgress />
          </div>
        </div>
      </section>

      {/* EmptyState Examples */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">{tx('ui.empty_state')}</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">{tx('ui.basic_empty_state')}</h3>
            <EmptyState
              icon={FileQuestion}
              title={tx('ui.no_items_found')}
              description={tx('dynamic_key_1500402850')}
            />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">{tx('ui.with_action')}</h3>
            <EmptyState
              icon={FileQuestion}
              title={tx('ui.no_projects_yet')}
              description={tx('dynamic_key_571944939')}
              action={{
                label: 'Create Project',
                onClick: () => console.log('Create project'),
              }}
            />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">{tx('ui.with_secondary_action')}</h3>
            <EmptyState
              icon={FileQuestion}
              title={tx('ui.no_results_found')}
              description={tx('dynamic_key_854531310')}
              action={{
                label: 'Clear Filters',
                onClick: () => console.log('Clear filters'),
              }}
              secondaryAction={{
                label: 'View All',
                onClick: () => console.log('View all'),
              }}
            />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">{tx('ui.error_state')}</h3>
            <EmptyState
              icon={AlertCircle}
              title={tx('ui.something_went_wrong')}
              description={tx('dynamic_key_1725907738')}
              variant="error"
              action={{
                label: 'Retry',
                onClick: () => console.log('Retry'),
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default LoadingStatesExamples;
