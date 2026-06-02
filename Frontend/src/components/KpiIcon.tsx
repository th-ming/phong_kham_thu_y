import React from "react";

type KpiIconName =
  | "receipt"
  | "check"
  | "alert"
  | "money"
  | "wallet"
  | "calendar"
  | "clock"
  | "medical"
  | "star"
  | "service"
  | "download"
  | "eye"
  | "print"
  | "qr"
  | "chevronLeft"
  | "chevronRight"
  | "history";

const svgProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

const KpiIcon: React.FC<{ name: KpiIconName; size?: number }> = ({ name, size = 30 }) => {
  const common = svgProps(size);
  switch (name) {
    case "receipt":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M6 3h12v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21V3Z" />
          <path d="M9 7h6M9 11h6M9 15h3" />
        </svg>
      );
    case "check":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12.5 2.2 2.2 4.8-5.4" />
        </svg>
      );
    case "alert":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 8v5" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.7 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
        </svg>
      );
    case "money":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="3" />
          <circle cx="12" cy="12" r="3" />
          <path d="M6.5 9.5v.01M17.5 14.5v.01" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" />
          <path d="M16 12h4" />
          <path d="M7 5v14" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="4" y="5" width="16" height="15" rx="3" />
          <path d="M8 3v4M16 3v4M4 10h16" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "medical":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
          <rect x="4" y="4" width="16" height="16" rx="5" />
        </svg>
      );
    case "star":
      return (
        <svg {...common} aria-hidden="true">
          <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.9 6.6 19.8l1-6.1-4.4-4.3 6.1-.9L12 3Z" />
        </svg>
      );
    case "service":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M7 7h10M7 12h10M7 17h6" />
          <rect x="4" y="3" width="16" height="18" rx="3" />
        </svg>
      );
    case "download":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 3v11" />
          <path d="m8 10 4 4 4-4" />
          <path d="M5 20h14" />
        </svg>
      );
    case "eye":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "print":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M7 8V4h10v4" />
          <path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
          <path d="M7 14h10v6H7z" />
        </svg>
      );
    case "qr":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
          <path d="M14 14h2v2h-2zM18 14h2v6h-4v-2M14 18v2" />
        </svg>
      );
    case "chevronLeft":
      return (
        <svg {...common} aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
      );
    case "chevronRight":
      return (
        <svg {...common} aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
    case "history":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    default:
      return null;
  }
};

export default KpiIcon;
