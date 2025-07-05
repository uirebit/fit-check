"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();

  // Detect current locale
  const segments = pathname.split("/");
  const currentLocale = ["en", "es", "pt"].includes(segments[1]) ? segments[1] : "en";

  const handleChange = (value: string) => {
    // Reemplaza el segmento de idioma en la URL
    const newPath = [""]
      .concat([value])
      .concat(segments.slice(2))
      .join("/");

    router.push(newPath);
  };

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4 text-gray-500" />
      <Select value={currentLocale} onValueChange={handleChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Español</SelectItem>
          <SelectItem value="pt">Português</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
