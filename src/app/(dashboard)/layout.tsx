export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Sidebar e Header serão implementados na Fase 2 */}
      <main className="p-6">{children}</main>
    </div>
  );
}
