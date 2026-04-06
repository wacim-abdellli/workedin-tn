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

export const LoadingStatesExamples = () => {
  return (
    <div className="space-y-12 p-8">
      {/* Spinner Examples */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Spinner</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Sizes</h3>
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
        <h2 className="text-2xl font-semibold mb-4">Skeleton</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Text Skeleton</h3>
            <Skeleton variant="text" width="200px" />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Circular Skeleton</h3>
            <Skeleton variant="circular" width="60px" height="60px" />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Rectangular Skeleton</h3>
            <Skeleton variant="rectangular" width="100%" height="120px" />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Skeleton Group</h3>
            <SkeletonGroup count={3} spacing={12} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Card Skeleton</h3>
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
        <h2 className="text-2xl font-semibold mb-4">Progress Bar</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Basic Progress</h3>
            <ProgressBar value={50} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">With Label</h3>
            <ProgressBar value={75} showLabel />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Custom Label</h3>
            <ProgressBar value={60} showLabel label="Uploading files..." />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Sizes</h3>
            <div className="space-y-3">
              <ProgressBar value={40} size="sm" />
              <ProgressBar value={60} size="md" />
              <ProgressBar value={80} size="lg" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Variants</h3>
            <div className="space-y-3">
              <ProgressBar value={50} variant="default" showLabel label="Default" />
              <ProgressBar value={100} variant="success" showLabel label="Success" />
              <ProgressBar value={70} variant="warning" showLabel label="Warning" />
              <ProgressBar value={30} variant="error" showLabel label="Error" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Indeterminate Progress</h3>
            <IndeterminateProgress />
          </div>
        </div>
      </section>

      {/* EmptyState Examples */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Empty State</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Basic Empty State</h3>
            <EmptyState
              icon={FileQuestion}
              title="No items found"
              description="There are no items to display at the moment."
            />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">With Action</h3>
            <EmptyState
              icon={FileQuestion}
              title="No projects yet"
              description="Get started by creating your first project."
              action={{
                label: 'Create Project',
                onClick: () => console.log('Create project'),
              }}
            />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">With Secondary Action</h3>
            <EmptyState
              icon={FileQuestion}
              title="No results found"
              description="Try adjusting your search or filters to find what you're looking for."
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
            <h3 className="text-lg font-medium mb-2">Error State</h3>
            <EmptyState
              icon={AlertCircle}
              title="Something went wrong"
              description="We couldn't load your data. Please try again."
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
