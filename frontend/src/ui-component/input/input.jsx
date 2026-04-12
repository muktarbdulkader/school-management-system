import React from 'react';

import cn from 'libs/class-names';
import { useInteractiveEvent } from 'hooks/use-interactive-event';
import { makeClassName } from 'libs/make-class-name';
import { FieldClearButton } from 'ui-component/typography/field-clear-button';
import { roundedStyles } from 'libs/rounded';
import { labelStyles } from 'libs/label-size';

const inputStyles = {
  base: 'flex items-center peer w-full transition duration-200 border [&.is-focus]:ring-[0.8px] ring-[0.6px] [&.is-hover]:border-primary [&.is-focus]:border-primary [&.is-focus]:ring-primary [&_input::placeholder]:opacity-60',
  disabled: '!bg-muted/70 backdrop-blur cursor-not-allowed !border-muted',
  error:
    '!border-red [&.is-hover]:!border-red [&.is-focus]:!border-red !ring-red !bg-transparent',
  size: {
    sm: 'px-2 py-1 text-xs h-8',
    md: 'px-3.5 py-2 text-sm h-10',
    lg: 'px-4 py-2 text-base h-12',
    xl: 'px-5 py-2.5 text-base h-14',
  },
  rounded: roundedStyles,
  variant: {
    text: 'border-transparent ring-transparent bg-transparent',
    flat: 'border-0 ring-muted/70 [&.is-focus]:ring-[1.8px] [&.is-focus]:bg-transparent bg-muted/70 backdrop-blur',
    outline: 'border border-muted ring-muted bg-transparent',
  },
};

const inputFieldStyles = {
  base: 'w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0',
  reset:
    '[&::-ms-clear]:hidden [&::-ms-reveal]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none',
  disabled: 'cursor-not-allowed placeholder:text-muted-foreground',
  clearable:
    '[&:placeholder-shown~.input-clear-btn]:opacity-0 [&:placeholder-shown~.input-clear-btn]:invisible [&:not(:placeholder-shown)~.input-clear-btn]:opacity-100 [&:not(:placeholder-shown)~.input-clear-btn]:visible',
  prefix: {
    size: {
      sm: 'ps-1.5',
      md: 'ps-2.5',
      lg: 'ps-3.5',
      xl: 'ps-4',
    },
  },
  suffix: {
    size: {
      sm: 'pe-1.5',
      md: 'pe-2.5',
      lg: 'pe-3.5',
      xl: 'pe-4',
    },
  },
};

export const Input = ({
  className,
  type = 'text',
  variant = 'outline',
  size = 'md',
  rounded = 'md',
  disabled,
  placeholder,
  label,
  labelWeight = 'medium',
  error,
  clearable,
  onClear,
  prefix,
  suffix,
  readOnly,
  helperText,
  labelClassName,
  inputClassName,
  helperClassName,
  prefixClassName,
  suffixClassName,
  onFocus,
  onBlur,
  ref,
  ...inputProps
}) => {
  const {
    isFocus,
    isHover,
    handleOnBlur,
    handleOnFocus,
    handleOnMouseEnter,
    handleOnMouseLeave,
  } = useInteractiveEvent({
    readOnly,
    onBlur,
    onFocus,
  });

  return (
    <div
      className={cn(makeClassName(`input-root`), 'flex flex-col', className)}
    >
      <label className="block">
        {label ? (
          <span
            className={cn(
              makeClassName(`input-label`),
              'block',
              labelStyles.size[size],
              labelStyles.weight[labelWeight],
              disabled && 'text-muted-foreground',
              labelClassName,
            )}
          >
            {label}
          </span>
        ) : null}

        <span
          className={cn(
            makeClassName(`input-container`),
            inputStyles.base,
            inputStyles.size[size],
            inputStyles.rounded[rounded],
            inputStyles.variant[variant],
            isHover && 'is-hover',
            isFocus && 'is-focus',
            disabled && inputStyles.disabled,
            error && inputStyles.error,
            inputClassName,
          )}
          data-focus={isFocus}
          data-hover={isHover}
          onMouseEnter={handleOnMouseEnter}
          onMouseLeave={handleOnMouseLeave}
        >
          {prefix ? (
            <span
              className={cn(
                makeClassName(`input-prefix`),
                'whitespace-nowrap leading-normal',
                prefixClassName,
              )}
            >
              {prefix}
            </span>
          ) : null}

          <input
            ref={ref}
            type={type}
            disabled={disabled}
            onBlur={handleOnBlur}
            onFocus={handleOnFocus}
            readOnly={readOnly}
            spellCheck="false"
            placeholder={placeholder || ''}
            className={cn(
              makeClassName(`input-field`),
              inputFieldStyles.base,
              inputFieldStyles.reset,
              !placeholder && 'placeholder-shown:placeholder:opacity-0',
              disabled && inputFieldStyles.disabled,
              clearable && inputFieldStyles.clearable,
              prefix && inputFieldStyles.prefix.size[size],
              suffix && inputFieldStyles.suffix.size[size],
            )}
            style={{ fontSize: 'inherit' }}
            {...inputProps}
          />

          {clearable ? (
            <FieldClearButton
              as="span"
              size={size}
              onClick={onClear}
              hasSuffix={Boolean(suffix)}
            />
          ) : null}

          {suffix ? (
            <span
              className={cn(
                makeClassName(`input-suffix`),
                'whitespace-nowrap leading-normal',
                suffixClassName,
              )}
            >
              {suffix}
            </span>
          ) : null}
        </span>
      </label>

      {!error && helperText ? (
        <FieldHelperText
          size={size}
          className={cn(
            makeClassName(`input-helper-text`),
            disabled && 'text-muted-foreground',
            helperClassName,
          )}
        >
          {helperText}
        </FieldHelperText>
      ) : null}
    </div>
  );
};

Input.displayName = 'Input';
