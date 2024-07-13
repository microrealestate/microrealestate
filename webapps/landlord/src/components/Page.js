import { Card } from './ui/card';
import { cn } from '../utils';
import Loading from './Loading';

function Page({ children, ActionBar, loading = false, dataCy, className }) {
  return (
    <div
      data-cy={dataCy}
      className={cn(
        'md:container md:mx-auto p-2 mt-4 mb-24 md:mb-4',
        className
      )}
    >
      {ActionBar ? (
        <Card
          className={cn(
            'fixed bottom-0 left-0 bg-card w-full z-50 border-t rounded-none',
            'md:relative md:z-auto md:border md:p-4 md:mb-6 md:rounded-lg'
          )}
        >
          {ActionBar}
        </Card>
      ) : null}
      {loading ? <Loading /> : children}
    </div>
  );
}

export default Page;
