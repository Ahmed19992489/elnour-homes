import { useEffect } from "react";

type UpdateHeadProps = {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
};

export function UpdateHead({
  title = "Elnour Homes | ديكورات وأعمال الاستيل الفاخرة",
  description = "متجر Elnour Homes المتخصص في تصميم وتصنيع أرقى ديكورات الاستيل، ترابيزات، مرايات، قواطع، وتجهيزات المنازل العصرية بجودة فائقة وضمان حقيقي.",
  image,
  path,
}: UpdateHeadProps) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description);
    }
  }, [title, description, image, path]);
}
