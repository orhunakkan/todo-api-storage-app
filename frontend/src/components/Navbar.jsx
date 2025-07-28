import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import { Home, CheckSquare, Users, BarChart3, User, LogOut, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Todos', href: '/todos', icon: CheckSquare },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Statistics', href: '/stats', icon: BarChart3 },
  ];

  const isActive = path => location.pathname === path;

  return (
    <nav className='bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800' data-testid="navbar">
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          {/* Logo and main navigation */}
          <div className='flex'>
            <div className='flex-shrink-0 flex items-center'>
              <Link
                to='/dashboard'
                className='text-xl font-bold text-primary-600 dark:text-primary-400'
                data-testid="navbar-logo"
              >
                TodoApp
              </Link>
            </div>

            {user && (
              <div className='hidden sm:ml-6 sm:flex sm:space-x-8' data-testid="navbar-menu-desktop">
                {navigation.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      data-testid={`navbar-link-${item.name.toLowerCase()}`}
                    >
                      <Icon className='h-4 w-4 mr-2' />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right side - theme toggle and user menu */}
          <div className='flex items-center space-x-4' data-testid="navbar-right-section">
            <ThemeToggle />

            {user ? (
              <div className='flex items-center space-x-4' data-testid="navbar-user-section">
                <div className='hidden sm:flex sm:items-center sm:space-x-2' data-testid="navbar-user-info">
                  <User className='h-5 w-5 text-gray-500 dark:text-gray-400' />
                  <span className='text-sm text-gray-700 dark:text-gray-300'>
                    {user.first_name || user.username}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className='inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200'
                  data-testid="navbar-logout-btn"
                >
                  <LogOut className='h-4 w-4 mr-2' />
                  <span className='hidden sm:inline'>Logout</span>
                </button>
              </div>
            ) : (
              <div className='flex items-center space-x-4' data-testid="navbar-auth-section">
                <Link
                  to='/login'
                  className='text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-2 text-sm font-medium transition-colors duration-200'
                  data-testid="navbar-login-link"
                >
                  Login
                </Link>
                <Link to='/register' className='btn btn-primary text-sm' data-testid="navbar-signup-btn">
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {user && (
              <div className='sm:hidden'>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className='p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500'
                  data-testid="navbar-mobile-menu-btn"
                >
                  {isMenuOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {user && isMenuOpen && (
        <div className='sm:hidden' data-testid="navbar-mobile-menu">
          <div className='pt-2 pb-3 space-y-1 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700'>
            {navigation.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block pl-3 pr-4 py-2 text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-r-4 border-primary-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  data-testid={`navbar-mobile-link-${item.name.toLowerCase()}`}
                >
                  <div className='flex items-center'>
                    <Icon className='h-5 w-5 mr-3' />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
