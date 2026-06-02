import React from "react";

interface BirthYearSelectProps {
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  minYear?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  "data-ai-id"?: string;
}

const BirthYearSelect: React.FC<BirthYearSelectProps> = ({
  value,
  onChange,
  minYear = 1900,
  placeholder = "Chọn năm sinh",
  disabled = false,
  required = false,
  className,
  style,
  onFocus,
  onBlur,
  "data-ai-id": dataAiId
}) => {
  const currentYear = new Date().getFullYear();
  const normalizedValue = value ? String(value) : "";

  return (
    <input
      data-ai-id={dataAiId}
      type="text"
      inputMode="numeric"
      pattern="[0-9]{4}"
      min={minYear}
      max={currentYear}
      maxLength={4}
      autoComplete="bday-year"
      value={normalizedValue}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 4))}
      disabled={disabled}
      required={required}
      className={className}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        width: "100%",
        appearance: "textfield",
        WebkitAppearance: "none",
        ...style
      }}
    />
  );
};

export default React.memo(BirthYearSelect);
