export default function QuickActionCard({ Icon, title, description }: any) {
  return (
    <div className="group flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#ff6f61]/40 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#ff6f61]/10 transition-colors duration-300 group-hover:bg-[#ff6f61]">
        <Icon className="h-5 w-5 text-[#ff6f61] transition-colors duration-300 group-hover:text-white" />
      </div>
      <div>
        <h4 className="mb-1 text-sm font-semibold text-slate-900 transition-colors group-hover:text-[#ff6f61]">
          {title}
        </h4>
        <p className="text-xs leading-snug text-slate-500">{description}</p>
      </div>
    </div>
  );
}
