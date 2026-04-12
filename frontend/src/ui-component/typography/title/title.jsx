import React from 'react';

import { fontWeightStyles } from 'libs/font-weight';
import cn from 'libs/class-names';
import { makeClassName } from 'libs/make-class-name';

const fontWeight = {
  ...fontWeightStyles,
  extraBold: 'font-extrabold',
};

const titleStyles = {
  as: {
    h1: 'text-4xl',
    h2: 'text-3xl',
    h3: 'text-2xl',
    h4: 'text-xl',
    h5: 'text-lg',
    h6: 'text-base',
  },
  fontWeight,
};

export default function Title({
  as = 'h2',
  fontWeight: weight = 'bold',
  children,
  className,
  ...props
}) {
  const Component = as;

  return (
    <Component
      className={cn(
        makeClassName(`title-${as}`),
        titleStyles.as[as],
        titleStyles.fontWeight[weight],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
