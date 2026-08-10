export default function StatCard({ title, count, Icon }: any) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#ff6f61]/40 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none">
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {title}
        </h3>
        <p className="mt-1 text-3xl font-semibold text-slate-900">{count}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#ff6f61]/10">
        <Icon className="h-6 w-6 text-[#ff6f61]" />
      </div>
    </div>
  );
}
