import { Suspense } from "react";
import OrdersPage from "@/components/commission/OrdersPage";

export default function Orders() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6">Carregando...</div>}>
      <OrdersPage />
    </Suspense>
  );
}
