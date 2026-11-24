'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  CheckSquare,
  ShieldCheck,
  BookOpen,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { useAcademic } from '@/lib/store';
import { UserRole } from '@/types/database';

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, users, setCurrentUser, setRole, resetToSeedData } = useAcademic();

  const navItems = [
    {
      label: 'Publications',
      href: '/ledger',
      icon: BookOpen,
    },
    {
      label: 'Author Portal',
      href: '/author',
      icon: FileText,
    },
    {
      label: 'Reviewer Workspace',
      href: '/reviewer',
      icon: CheckSquare,
    },
    {
      label: 'Chair Dashboard',
      href: '/chair',
      icon: ShieldCheck,
    },
  ];

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[240px] bg-white border-r border-[#E2E8F0] flex flex-col z-30 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E2E8F0]">
        <Link href="/ledger" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-[#0F172A]">
              Scholarly
            </div>
            <div className="text-[11px] text-[#64748B]">
              Peer-Review & Publishing
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/ledger' && pathname === '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#0F172A] text-white'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Role Switcher at Bottom */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-2.5">
        <div className="flex items-center justify-between text-[11px] text-[#64748B]">
          <span className="font-medium text-[#0F172A]">Switch Persona</span>
          <button
            onClick={resetToSeedData}
            title="Reset to default seed data"
            className="hover:text-[#0F172A] flex items-center gap-1 text-[10px]"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Reset
          </button>
        </div>

        {/* 3 Quick Role Buttons */}
        <div className="grid grid-cols-3 gap-1 bg-[#E2E8F0] p-0.5 rounded-md text-[11px]">
          {(['AUTHOR', 'REVIEWER', 'CHAIR'] as UserRole[]).map((role) => (
            <button
              key={role}
              onClick={() => setRole(role)}
              className={`py-1 rounded text-center font-medium transition-all ${
                currentUser.role === role
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {role === 'AUTHOR' ? 'Author' : role === 'REVIEWER' ? 'Reviewer' : 'Chair'}
            </button>
          ))}
        </div>

        {/* User Dropdown */}
        <div>
          <select
            value={currentUser.user_id}
            onChange={(e) => {
              const selected = users.find((u) => u.user_id === e.target.value);
              if (selected) setCurrentUser(selected);
            }}
            className="w-full text-xs font-medium text-[#0F172A] bg-white border border-[#CBD5E1] rounded px-2 py-1.5 focus:outline-none truncate"
          >
            {users.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.first_name} {u.last_name} ({u.role.toLowerCase()})
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
}
