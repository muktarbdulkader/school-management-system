import * as React from "react";

export default function UserIDIcon({
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
        d="M9 11C10.1046 11 11 10.1046 11 9C11 7.89543 10.1046 7 9 7C7.89543 7 7 7.89543 7 9C7 10.1046 7.89543 11 9 11Z"
        stroke={color}
        strokeWidth={1.5}
      />
      <path
        d="M13 15C13 16.105 13 17 9 17C5 17 5 16.105 5 15C5 13.895 6.79 13 9 13C11.21 13 13 13.895 13 15Z"
        stroke={color}
        strokeWidth={1.5}
      />
      <path
        d="M2 12C2 8.229 2 6.343 3.172 5.172C4.344 4.001 6.229 4 10 4H14C17.771 4 19.657 4 20.828 5.172C21.999 6.344 22 8.229 22 12C22 15.771 22 17.657 20.828 18.828C19.656 19.999 17.771 20 14 20H10C6.229 20 4.343 20 3.172 18.828C2.001 17.656 2 15.771 2 12Z"
        stroke={color}
        strokeWidth={1.5}
      />
      <path
        d="M19 12H15M19 9H14M19 15H16"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}
