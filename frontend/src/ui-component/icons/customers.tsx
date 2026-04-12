import * as React from "react";

export default function CustomersIcon({
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="w-6 h-6"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8 11C11.866 11 15 13.2386 15 16C15 17.1046 14.1046 18 13 18H3C1.89543 18 1 17.1046 1 16C1 13.2386 4.13401 11 8 11ZM8 2C10.2091 2 12 3.79086 12 6C12 8.20914 10.2091 10 8 10C5.79086 10 4 8.20914 4 6C4 3.79086 5.79086 2 8 2ZM16 4C16.5523 4 17 4.44772 17 5V6H18C18.5523 6 19 6.44772 19 7C19 7.55228 18.5523 8 18 8H17V9C17 9.55228 16.5523 10 16 10C15.4477 10 15 9.55228 15 9V8H14C13.4477 8 13 7.55228 13 7C13 6.44772 13.4477 6 14 6H15V5C15 4.44772 15.4477 4 16 4Z"
        fill="white"
      />
    </svg>
  );
}
