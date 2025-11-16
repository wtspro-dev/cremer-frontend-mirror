import { Suspense } from "react";
import InvoicesPage from "@/components/commission/InvoicesPage";

export default function Invoices() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6">Carregando...</div>}>
      <InvoicesPage />
    </Suspense>
  );
}
