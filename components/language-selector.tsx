"use client";

import { usePathname, useRouter } from "next/navigation";

const locales = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
];

export default function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();

  // Detect current locale
  const pathSegments = pathname.split("/");
  const currentLocale = locales.find((l) => l.code === pathSegments[1])?.code || "en";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;

    // Replace the locale in the path
    const newPath = [""]
      .concat([newLocale])
      .concat(pathSegments.slice(2))
      .join("/");

    router.push(newPath);
  };

  return (
    <select
      value={currentLocale}
      onChange={handleChange}
      className="border px-2 py-1 rounded"
    >
      {locales.map((locale) => (
        <option key={locale.code} value={locale.code}>
          {locale.label}
        </option>
      ))}
    </select>
  );
}
