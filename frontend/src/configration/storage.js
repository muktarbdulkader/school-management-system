const defaultStorage = localStorage;

export const Storage = defaultStorage == localStorage ? localStorage : sessionStorage;
