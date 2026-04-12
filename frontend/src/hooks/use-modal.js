import { atom, useAtomValue, useSetAtom } from 'jotai';
import React from 'react';

// Initial modal state (no TypeScript types needed)
const modalAtom = atom({
  isOpen: false,
  view: null,
  customSize: '600px',
  onClose: () => {},
  containerClassName: '',
  position: 'center',
  rounded: 'md',
});

export function useModal() {
  const state = useAtomValue(modalAtom);
  const setState = useSetAtom(modalAtom);

  const openModal = ({
    view,
    customSize,
    onClose,
    containerClassName,
    position,
    rounded,
  }) => {
    setState({
      ...state,
      isOpen: true,
      view,
      customSize,
      onClose,
      position,
      rounded,
      containerClassName,
    });
  };

  const closeModal = () => {
    setState({
      ...state,
      isOpen: false,
    });
  };

  return {
    ...state,
    openModal,
    closeModal,
  };
}
