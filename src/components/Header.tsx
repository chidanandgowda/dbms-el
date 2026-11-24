'use client';

import { useAcademic } from '@/lib/store';

export function Header() {
  const { currentUser } = useAcademic();

  return (
    <header className="h-14 border-b border-[#E2E8F0] bg-white flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Current User Info */}
      <div className="flex items-center gap-2.5 text-xs">
        <span className="font-semibold text-[#0F172A]">
          {currentUser.first_name} {currentUser.last_name}
        </span>
        <span className="text-[#94A3B8]">·</span>
        <span className="text-[#475569]">{currentUser.affiliation}</span>
        <span
          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
            currentUser.role === 'CHAIR'
              ? 'badge-pending'
              : currentUser.role === 'REVIEWER'
              ? 'badge-double-blind'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {currentUser.role}
        </span>
      </div>

      {/* Subtle system indicator */}
      <div className="flex items-center gap-2 text-xs text-[#64748B]">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-[11px]">System Ready</span>
      </div>
    </header>
  );
}
