import { useEffect, useState } from "react";
import { customerTitles, splitTitle, withTitle } from "../../lib/names";

interface Props {
  value: string; // the full name, title included ("م. أحمد")
  onChange: (full: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  fieldName?: string;
}

const OTHER = "__other";

/** A name box with the customer's preferred title next to it; the title is stored as part of the name. */
export function NameWithTitle({ value, onChange, label = "اسم العميل", required, placeholder = "الاسم اللي هنناديه بيه", fieldName = "customerName" }: Props) {
  const initial = splitTitle(value);
  const [title, setTitle] = useState(initial.title);
  const [custom, setCustom] = useState(!!initial.title && !(customerTitles as readonly string[]).includes(initial.title));

  // A different customer was loaded into the form.
  useEffect(() => {
    const s = splitTitle(value);
    if (value.trim() && s.title !== title) {
      setTitle(s.title);
      setCustom(!!s.title && !(customerTitles as readonly string[]).includes(s.title));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const name = splitTitle(value).name;
  const emit = (t: string, n: string) => onChange(withTitle(t, n) || (t ? "" : n));

  return (
    <div className="field">
      <span>
        {label} {required && <em>مطلوب</em>}
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <select
          aria-label="اللقب"
          style={{ width: 118, flexShrink: 0 }}
          value={custom ? OTHER : title}
          onChange={(e) => {
            if (e.target.value === OTHER) {
              setCustom(true);
              setTitle("");
              emit("", name);
            } else {
              setCustom(false);
              setTitle(e.target.value);
              emit(e.target.value, name);
            }
          }}
        >
          <option value="">بدون لقب</option>
          {customerTitles.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          <option value={OTHER}>لقب آخر…</option>
        </select>
        {custom && (
          <input
            aria-label="اللقب"
            style={{ width: 96, flexShrink: 0 }}
            placeholder="اللقب"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              emit(e.target.value, name);
            }}
          />
        )}
        <input
          name={fieldName}
          autoComplete="name"
          required={required}
          placeholder={placeholder}
          style={{ flex: 1, minWidth: 0 }}
          value={name}
          onChange={(e) => emit(title, e.target.value)}
        />
      </div>
    </div>
  );
}
