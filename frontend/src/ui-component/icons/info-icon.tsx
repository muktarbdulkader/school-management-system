import * as React from "react";

export default function InfoIcon({
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
        d="M22.5 12C22.5 6.47715 18.0228 2 12.5 2C6.97715 2 2.5 6.47715 2.5 12C2.5 17.5228 6.97715 22 12.5 22C18.0228 22 22.5 17.5228 22.5 12Z"
        stroke={color}
        strokeWidth={1.5}
      />
      <path
        d="M12.7422 17V12C12.7422 11.5286 12.7422 11.2929 12.5957 11.1464C12.4493 11 12.2136 11 11.7422 11"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.492 8H12.501"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
