import { cn } from '@microrealestate/commonui/utils';
import Loading from './Loading';

function Page({ children, ActionBar, loading = false, dataCy, className }) {
  return (
    <div
      data-cy={dataCy}
      className={cn(
        'p-2 mt-4 mb-24 md:container md:mx-auto md:mb-4',
        className
      )}
    >
      {ActionBar ? (
        <div
          className={cn(
            'fixed bottom-0 left-0 w-full z-50 border-t shadow-xl bg-card',
            'md:relative md:mb-6 md:z-auto md:border-none md:shadow-none md:bg-transparent'
          )}
        >
          {ActionBar}
        </div>
      ) : null}
      {loading ? <Loading /> : children}
    </div>
  );
}

export default Page;
