import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SHEET_SPECS, SPREADSHEET_NAME } from "@/services/sheetSchema";

export const Route = createFileRoute("/setup-guide")({
  head: () => ({
    meta: [
      { title: "SheetDB Setup Guide | Water Maintenance Dashboard" },
      { name: "description", content: "How to lay out the Google Sheet that powers the water maintenance dashboard: tabs, columns and examples." },
      { property: "og:title", content: "SheetDB Setup Guide" },
      { property: "og:description", content: "Tabs, columns, allowed values and example rows for the society's maintenance Google Sheet." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SetupGuide,
});

function SetupGuide() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-info hover:underline">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
        <header>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <FileSpreadsheet className="size-6 text-info" /> SheetDB Setup Guide
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create a Google Sheet named <b>{SPREADSHEET_NAME}</b> with the tabs below. Row 1 of each
            tab must contain the column names exactly as shown. Then create a SheetDB API for the sheet
            and share the API URL to connect it.
          </p>
        </header>

        {SHEET_SPECS.map((spec) => (
          <Card key={spec.key} className="gap-3 p-5 shadow-card">
            <h2 className="text-lg font-semibold">Tab: “{spec.tab}”</h2>
            <p className="text-sm text-muted-foreground">{spec.intro}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="p-2">Column</th><th className="p-2">Required</th>
                    <th className="p-2">Type / allowed</th><th className="p-2">Example</th>
                    <th className="p-2">What it's for</th>
                  </tr>
                </thead>
                <tbody>
                  {spec.columns.map((c) => (
                    <tr key={c.name} className="border-t border-border align-top">
                      <td className="p-2 font-mono font-semibold">{c.name}</td>
                      <td className="p-2">{c.required ? "Yes" : "Optional"}</td>
                      <td className="p-2">{c.allowed ?? c.type}</td>
                      <td className="p-2 font-mono">{c.example || "—"}</td>
                      <td className="p-2 text-muted-foreground">{c.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm font-semibold">Example rows</p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full font-mono text-xs">
                <thead className="bg-muted">
                  <tr>{spec.columns.map((c) => <th key={c.name} className="p-2 text-left">{c.name}</th>)}</tr>
                </thead>
                <tbody>
                  {spec.exampleRows.map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      {r.map((v, j) => <td key={j} className="p-2">{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </main>
    </div>
  );
}
