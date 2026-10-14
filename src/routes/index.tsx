import { createFileRoute } from "@tanstack/react-router";
import { BloodPressureApp } from "@/components/BloodPressureApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Давление — дневник замеров" },
      {
        name: "description",
        content:
          "Мобильный дневник артериального давления: график, история замеров, пульс, импорт и экспорт записей.",
      },
      { property: "og:title", content: "Давление — дневник замеров" },
      {
        property: "og:description",
        content:
          "Мобильный дневник артериального давления: график, история замеров, пульс, импорт и экспорт записей.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <BloodPressureApp />;
}
