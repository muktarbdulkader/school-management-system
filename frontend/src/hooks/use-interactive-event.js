import React, { useState, useCallback } from 'react';

export function useInteractiveEvent({
  readOnly,
  onFocus,
  onBlur,
  onMouseEnter,
  onMouseLeave,
}) {
  const [isFocus, setIsFocus] = useState(false);
  const [isHover, setIsHover] = useState(false);

  const handleOnFocus = useCallback(
    (e) => {
      if (readOnly === true) return false;
      setIsFocus((prevState) => !prevState);
      if (onFocus) onFocus(e);
    },
    [readOnly, onFocus],
  );

  const handleOnBlur = useCallback(
    (e) => {
      if (readOnly === true) return false;
      setIsFocus(() => false);
      if (onBlur) onBlur(e);
    },
    [readOnly, onBlur],
  );

  const handleOnMouseEnter = useCallback(
    (e) => {
      if (readOnly === true) return false;
      setIsHover(() => true);
      if (onMouseEnter) onMouseEnter(e);
    },
    [readOnly],
  );

  const handleOnMouseLeave = useCallback(
    (e) => {
      if (readOnly === true) return false;
      setIsHover(() => false);
      if (onMouseLeave) onMouseLeave(e);
    },
    [readOnly],
  );

  return {
    isFocus,
    isHover,
    handleOnFocus,
    handleOnBlur,
    handleOnMouseEnter,
    handleOnMouseLeave,
  };
}
