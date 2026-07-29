import * as React from "react";

const PaymentIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
    >
        <rect x={2} y={5} width={20} height={14} rx={2.5} />
        <path d="M2 9.5h20" />
        <path d="M6 15h4" />
    </svg>
);

export default PaymentIcon;
