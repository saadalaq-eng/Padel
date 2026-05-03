'use client';

import type { ComponentType, SVGProps } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  TableCellsIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface NavTab {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const TABS: NavTab[] = [
  { href: '/',        label: 'Table',   Icon: TableCellsIcon   },
  { href: '/matches', label: 'Matches', Icon: CalendarDaysIcon  },
  { href: '/admin',   label: 'Admin',   Icon: ShieldCheckIcon   },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-pl-purple-dark border-t border-white/10 h-16 flex items-center justify-around w-full">
      {TABS.map(({ href, label, Icon }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 text-xs font-medium px-4 py-2 relative transition-colors ${
              isActive ? 'text-pl-green' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {/* Green dot indicator above icon */}
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pl-green" />
            )}
            <Icon className="w-6 h-6" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
