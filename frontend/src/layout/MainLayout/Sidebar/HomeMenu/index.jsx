import React from 'react';
import { home } from 'menu-items/home';
import NavItem from '../MenuList/NavItem';

const HomeMenu = () => {
  const menu = home();
  return <NavItem key={menu.id} item={menu} level={1} />;
};

export default HomeMenu;
