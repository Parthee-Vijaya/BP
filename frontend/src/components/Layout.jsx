import { Link, useLocation } from 'react-router-dom';

// Kalundborg Kommune Logo Component (fem-tårnet kirke med bølger)
const KalundborgLogo = () => (
    <svg viewBox="0 0 80 60" className="h-10 w-auto" fill="currentColor">
        {/* De fem tårne med kors */}
        <g fill="currentColor">
            {/* Tårn 1 */}
            <rect x="8" y="20" width="8" height="25" />
            <polygon points="12,8 6,20 18,20" />
            <rect x="10" y="2" width="4" height="8" />
            <rect x="8" y="4" width="8" height="2" />

            {/* Tårn 2 */}
            <rect x="20" y="20" width="8" height="25" />
            <polygon points="24,8 18,20 30,20" />
            <rect x="22" y="2" width="4" height="8" />
            <rect x="20" y="4" width="8" height="2" />

            {/* Tårn 3 (center - tallest) */}
            <rect x="32" y="15" width="10" height="30" />
            <polygon points="37,3 29,15 45,15" />
            <rect x="35" y="-3" width="4" height="8" />
            <rect x="33" y="-1" width="8" height="2" />

            {/* Tårn 4 */}
            <rect x="46" y="20" width="8" height="25" />
            <polygon points="50,8 44,20 56,20" />
            <rect x="48" y="2" width="4" height="8" />
            <rect x="46" y="4" width="8" height="2" />

            {/* Tårn 5 */}
            <rect x="58" y="20" width="8" height="25" />
            <polygon points="62,8 56,20 68,20" />
            <rect x="60" y="2" width="4" height="8" />
            <rect x="58" y="4" width="8" height="2" />
        </g>

        {/* Bølger under kirken */}
        <path d="M5,50 Q15,45 25,50 T45,50 T65,50 T75,50" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M5,56 Q15,51 25,56 T45,56 T65,56 T75,56" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
);

// SVG Icons
const Icons = {
    dashboard: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    ),
    check: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    child: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    clock: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    list: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
    )
};

export default function Layout({ children, userRole, onRoleChange }) {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const adminNavItems = [
        { path: '/admin', label: 'Oversigt', icon: Icons.dashboard },
        { path: '/admin/godkendelse', label: 'Godkendelse', icon: Icons.check },
        { path: '/admin/boern', label: 'Børn', icon: Icons.child },
        { path: '/admin/barnepiger', label: 'Barnepiger', icon: Icons.users },
    ];

    const caregiverNavItems = [
        { path: '/barnepige', label: 'Mine Børn', icon: Icons.child },
        { path: '/barnepige/registrer', label: 'Registrer Timer', icon: Icons.clock },
        { path: '/barnepige/mine-timer', label: 'Mine Registreringer', icon: Icons.list },
    ];

    const navItems = userRole === 'admin' ? adminNavItems : caregiverNavItems;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header - Kalundborg Kommune themed */}
            <header className="bg-[#B54A32] shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            {/* Logo */}
                            <Link to="/" className="flex items-center gap-4 group">
                                <div className="text-white">
                                    <KalundborgLogo />
                                </div>
                                <div className="border-l border-white/30 pl-4">
                                    <h1 className="text-lg font-semibold text-white tracking-wide">
                                        KALUNDBORG
                                    </h1>
                                    <p className="text-white/80 text-xs tracking-widest uppercase">Kommune</p>
                                </div>
                            </Link>

                            {/* Divider */}
                            <div className="hidden md:block h-10 w-px bg-white/20"></div>

                            {/* App title */}
                            <div className="hidden md:block">
                                <h2 className="text-white font-medium">Timeregistrering</h2>
                                <p className="text-white/70 text-xs">Barnepige-ordningen</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Role badge */}
                            <span className="hidden sm:inline-flex px-3 py-1.5 bg-white/10 text-white text-xs font-medium rounded-full border border-white/20">
                                {userRole === 'admin' ? 'Administrator' : 'Barnepige'}
                            </span>

                            {/* Role switcher (for demo) */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-white/70 hidden sm:inline">Vis som:</span>
                                <select
                                    value={userRole}
                                    onChange={(e) => onRoleChange(e.target.value)}
                                    className="text-sm bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-white/30 focus:outline-none cursor-pointer hover:bg-white/20 transition-colors"
                                >
                                    <option value="admin" className="text-gray-900">Administrator</option>
                                    <option value="caregiver" className="text-gray-900">Barnepige</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-1 overflow-x-auto">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                                    isActive(item.path)
                                        ? 'border-[#B54A32] text-[#B54A32] bg-[#B54A32]/5'
                                        : 'border-transparent text-gray-600 hover:text-[#B54A32] hover:bg-gray-50'
                                }`}
                            >
                                <span className={isActive(item.path) ? 'text-[#B54A32]' : 'text-gray-400'}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[#B54A32]">
                            <KalundborgLogo />
                            <span className="text-sm font-medium">Kalundborg Kommune</span>
                        </div>
                        <p className="text-sm text-gray-500">
                            Timeregistrering for Barnepige-ordningen
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
