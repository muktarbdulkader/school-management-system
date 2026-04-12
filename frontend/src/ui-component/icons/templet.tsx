import * as React from "react";

export default function TempIcon({
  strokeWidth = 2.75,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={30}
      height={34}
      viewBox="0 0 40 40" // Adjusted viewBox to fit all paths
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M26.5834 32.0833V13.75H13.7502C9.42907 13.75 7.26849 13.75 5.92606 15.0924C4.58362 16.4348 4.58361 18.5953 4.58357 22.9167L4.5835 30.25C4.58346 34.5712 4.58344 36.7317 5.92586 38.0743C7.2683 39.4167 9.42892 39.4167 13.7502 39.4167H19.2501C22.707 39.4167 24.4355 39.4167 25.5094 38.3427C26.5834 37.2687 26.5834 35.5403 26.5834 32.0833Z"
        stroke="#D7F400"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26.5834 32.0833V13.75H13.7502C9.42907 13.75 7.26849 13.75 5.92606 15.0924C4.58362 16.4348 4.58361 18.5953 4.58357 22.9167L4.5835 30.25C4.58346 34.5712 4.58344 36.7317 5.92586 38.0743C7.2683 39.4167 9.42892 39.4167 13.7502 39.4167H19.2501C22.707 39.4167 24.4355 39.4167 25.5094 38.3427C26.5834 37.2687 26.5834 35.5403 26.5834 32.0833Z"
        stroke="black"
        strokeOpacity={0.2}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26.5829 30.2507H30.2495C34.5707 30.2507 36.7315 30.2507 38.0738 28.9083C39.4162 27.5657 39.4162 25.4052 39.4162 21.084V13.7507C39.4162 9.42945 39.4162 7.26885 38.0738 5.92641C36.7315 4.58398 34.5707 4.58398 30.2495 4.58398H17.4165L17.4168 13.7507"
        stroke="#D7F400"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.0835 22.916H16.5002M10.0835 30.2493H21.0836"
        stroke="#D7F400"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.4165 4.58398L26.5832 13.7507"
        stroke="#D7F400"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
