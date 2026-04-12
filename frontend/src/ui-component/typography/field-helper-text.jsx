import cn from 'libs/class-names';
import React from 'react';

const helperTextStyles = {
  size: {
    xs: 'text-[9px] ',
    sm: 'text-[11px] mt-0.5',
    md: 'text-[13px] mt-0.5',
    lg: 'text-[13px] mt-1',
    xl: 'text-sm mt-1',
  },
};

export function FieldHelperText({ size, as = 'div', children, className }) {
  const Component = as;
  return (
    <Component
      role="alert"
      className={cn(size && helperTextStyles.size[size], className)}
    >
      {children}
    </Component>
  );
}

FieldHelperText.displayName = 'FieldHelperText';
