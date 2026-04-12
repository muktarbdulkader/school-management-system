import React from 'react';
import { Loader } from 'rizzui/loader';
// import cn from '@yegna-systems/ui/cn';
import Header from 'layout/MainLayout/Header';
import FallbackComponent from 'utils/fallback/NotFound';
import cn from 'libs/class-names';

const PageWrapper = ({
  hasHeader = true,
  title,
  search,
  back = false,
  breadcrumb = true,
  hasActionButton = false,
  actionButtons,
  children,
  isLoading,
  isError,
  fallback,
  notfound,
  childrenClassnames,
  staticComponent,
}) => {
  return (
    <div className="w-full">
      <div className={cn('p-2', childrenClassnames)}>
        {staticComponent}
        {isLoading ? (
          <div className="w-full h-52 flex flex-col items-center justify-center">
            <Loader color="success" className="w-8 h-8 text-primary" />
          </div>
        ) : isError && fallback ? (
          <FallbackComponent
            status_code={fallback?.status_code}
            title={fallback?.title}
            message={fallback?.message}
            action={fallback?.action}
          />
        ) : notfound && fallback ? (
          <FallbackComponent
            status_code={fallback?.status_code}
            title={fallback?.title}
            message={fallback?.message}
            action={fallback?.action}
          />
        ) : (
          <div>{children}</div>
        )}
      </div>
    </div>
  );
};

export default PageWrapper;
