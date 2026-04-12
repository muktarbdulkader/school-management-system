import { useInteractiveEvent } from 'hooks/use-interactive-event';
import cn from 'libs/class-names';
import { labelStyles } from 'libs/label-size';
import { makeClassName } from 'libs/make-class-name';
import { roundedStyles } from 'libs/rounded';
import React, { forwardRef } from 'react';
import { FieldClearButton } from 'ui-component/typography/field-clear-button';
import { FieldHelperText } from 'ui-component/typography/field-helper-text';

const textareaStyles = {
  base: 'block focus:outline-none bg-transparent transition duration-200 placeholder:opacity-60 ring-[0.6px] [&.is-focus]:ring-[0.8px] [&.is-focus]:ring-primary [&.is-hover]:border-primary [&.is-focus]:border-primary',
  scrollBar:
    '[scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-[2px] [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground [&::-webkit-scrollbar-track]:rounded-[2px] [&::-webkit-scrollbar-track]:bg-transparent',
  disabled:
    '!bg-muted/70 backdrop-blur cursor-not-allowed !border-muted placeholder:text-muted-foreground',
  clearable:
    '[&:placeholder-shown~.input-clear-btn]:opacity-0 [&:placeholder-shown~.input-clear-btn]:invisible [&:not(:placeholder-shown)~.input-clear-btn]:opacity-100 [&:not(:placeholder-shown)~.input-clear-btn]:visible',
  error: '!border-red hover:!border-red focus:!border-red !ring-red',
  size: {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-4 py-2.5 text-base',
  },
  rounded: roundedStyles,
  variant: {
    text: 'border-transparent ring-transparent bg-transparent',
    flat: 'border-0 ring-muted/70 [&.is-focus]:ring-[1.8px] [&.is-focus]:bg-transparent bg-muted/70 backdrop-blur',
    outline: 'bg-transparent ring-muted border border-muted',
  },
};

const clearButtonSpacing = {
  base: 'absolute',
  size: {
    sm: 'end-2.5 top-1',
    md: 'end-4 top-2',
    lg: 'end-5 top-2',
    xl: 'end-6 top-2.5',
  },
};

export const Textarea = forwardRef(
  (
    {
      variant = 'outline',
      size = 'md',
      rounded = 'md',
      labelWeight = 'medium',
      cols,
      rows = 5,
      label,
      error,
      clearable,
      onClear,
      readOnly,
      disabled,
      className,
      labelClassName,
      textareaClassName,
      helperClassName,
      helperText,
      onFocus,
      onBlur,
      maxLength,
      placeholder,
      renderCharacterCount,
      onMouseEnter,
      onMouseLeave,
      ...textareaProps
    },
    ref,
  ) => {
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
      onMouseEnter,
      onMouseLeave,
    });

    return (
      <div
        className={cn(
          makeClassName(`textarea-root`),
          'flex flex-col',
          className,
        )}
      >
        <label className="block">
          {label ? (
            <span
              className={cn(
                makeClassName(`textarea-label`),
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

          <span className="relative block">
            <textarea
              ref={ref}
              rows={rows}
              disabled={disabled}
              onBlur={handleOnBlur}
              onFocus={handleOnFocus}
              readOnly={readOnly}
              maxLength={maxLength}
              onMouseEnter={handleOnMouseEnter}
              onMouseLeave={handleOnMouseLeave}
              {...(cols && { cols })}
              placeholder={placeholder || 'Screen reader only'}
              className={cn(
                makeClassName(`textarea-field`),
                textareaStyles.base,
                textareaStyles.scrollBar,
                textareaStyles.size[size],
                textareaStyles.rounded[rounded],
                textareaStyles.variant[variant],
                clearable && textareaStyles.clearable,
                !placeholder && 'placeholder-shown:placeholder:opacity-0',
                isHover && 'is-hover',
                isFocus && 'is-focus',
                !cols && 'w-full',
                readOnly && 'focus:ring-0',
                disabled && textareaStyles.disabled,
                error && textareaStyles.error,
                textareaClassName,
              )}
              {...textareaProps}
            />

            {clearable && (
              <FieldClearButton
                size={size}
                onClick={onClear}
                className={cn(
                  clearButtonSpacing.base,
                  clearButtonSpacing.size[size],
                )}
              />
            )}

            {renderCharacterCount &&
              renderCharacterCount({
                characterCount: String(textareaProps?.value).length,
                maxLength,
              })}
          </span>
        </label>

        {!error && helperText && (
          <FieldHelperText
            size={size}
            className={cn(
              makeClassName(`textarea-helper-text`),
              disabled && 'text-muted-foreground',
              helperClassName,
            )}
          >
            {helperText}
          </FieldHelperText>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
