import { useEffect } from "react";

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = `${title} | Atelier Furnish`;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) {
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
  }, [title, description]);
}
