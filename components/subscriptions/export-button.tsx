"use client";

import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';

interface ExportButtonProps {
  subscriptions: any[];
}

export default function ExportButton({ subscriptions }: ExportButtonProps) {
  const exportToCSV = () => {
    if (!subscriptions || subscriptions.length === 0) {
      alert("No subscriptions to export");
      return;
    }

    // Define CSV headers
    const headers = [
      "Client Name",
      "Client Email",
      "Subscription Type",
      "Status",
      "Start Date",
      "End Date",
      "Renewal Date",
      "Price",
      "Notes",
    ];

    // Convert subscriptions to CSV rows
    const rows = subscriptions.map((sub) => [
      sub.client_name || "",
      sub.client_email || "",
      sub.subscription_type || "",
      sub.status || "",
      sub.start_date || "",
      sub.end_date || "",
      sub.renewal_date || "",
      sub.price || "",
      sub.notes || "",
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `subscriptions-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button variant="outline" onClick={exportToCSV}>
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </Button>
  );
}
