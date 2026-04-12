import * as React from "react";

export default function InstitutionIcon({
  strokeWidth,
  color = "#888",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={strokeWidth}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M15 9L17.15 9.645C18.523 10.057 19.21 10.263 19.605 10.795C20 11.325 20 12.043 20 13.476V21M7 8H10M7 12H10M11 21V18C11 17.057 11 16.586 10.707 16.293C10.414 16 9.943 16 9 16H8C7.057 16 6.586 16 6.293 16.293C6 16.586 6 17.057 6 18V21M1 21H21"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M2 21.0001V5.71711C2 3.20711 2 1.95111 2.791 1.32811C3.582 0.705106 4.747 1.04411 7.078 1.72011L12.078 3.17111C13.484 3.57911 14.187 3.78311 14.593 4.34011C15 4.89611 15 5.65311 15 7.16911V21.0001"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
