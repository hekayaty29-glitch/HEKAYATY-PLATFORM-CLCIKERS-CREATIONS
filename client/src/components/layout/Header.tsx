import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFlag } from "@/lib/flags";
import { useLang } from "@/context/LanguageContext";
import { useRoles } from "@/hooks/useRoles";
import { useNotifications } from "@/hooks/useNotifications";
import { useAdmin } from '@/context/AdminContext';
import { toast } from "sonner";
import { Menu, BookOpen, PenSquare, Award, Users, ChevronDown, Megaphone, Shield, Bell, Globe, Star, Hammer, Home } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const { isVip } = useRoles();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const { toggle: toggleLang } = useLang();

  const handleLanguageSwitch = () => {
    toggleLang();
  };

  const showRecs = useFlag("recommendations");

  // Notifications
  const { notifications } = useNotifications(user ? String(user.id) : undefined);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const prevCount = useRef(unreadCount);
  useEffect(() => {
    if (unreadCount > prevCount.current) {
      toast("New notifications", {
        description: `You have ${unreadCount} unread notifications`,
      });
    }
    prevCount.current = unreadCount;
  }, [unreadCount]);

  return (
    <header className="text-amber-50 shadow-lg sticky top-0 z-50 safe-area-inset-top" style={{ backgroundColor: '#151008' }}>
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center min-h-[60px] sm:min-h-[70px]">
        <div className="flex items-center">
          <Link href="/" className="text-xl sm:text-2xl md:text-3xl font-cinzel font-bold">
            <span className="text-amber-500">Heka</span>yaty
          </Link>
        </div>
        
        {/* Navigation for desktop */}
        <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
          <Link href="/home" className="font-cinzel text-xs xl:text-sm hover:text-amber-500 transition-colors flex items-center gap-1">
            <Home className="h-3 w-3 xl:h-4 xl:w-4" />
            <span className="hidden xl:inline">Home</span>
          </Link>
          <Link href="/originals" className="font-cinzel text-xs xl:text-sm hover:text-amber-500 transition-colors flex items-center gap-1">
            <BookOpen className="h-3 w-3 xl:h-4 xl:w-4" />
            <span className="hidden xl:inline">Discover</span>
          </Link>

          <Link href="/subscribe" className="font-cinzel text-xs xl:text-sm hover:text-amber-500 transition-colors flex items-center gap-1">
            <Star className="h-3 w-3 xl:h-4 xl:w-4" />
            <span className="hidden xl:inline">Get Code</span>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="link" className="font-cinzel text-xs xl:text-sm text-amber-50 hover:text-amber-500 p-0 flex items-center gap-1">
                <Award className="h-3 w-3 xl:h-4 xl:w-4" />
                <span className="hidden xl:inline">Genres</span>
                <ChevronDown className="h-2 w-2 xl:h-3 xl:w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="bg-midnight-blue border-amber-500">
              <DropdownMenuItem asChild>
                <Link href="/genres/1" className="cursor-pointer hover:bg-amber-900">Fantasy</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/genres/2" className="cursor-pointer hover:bg-amber-900">Romance</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/genres/3" className="cursor-pointer hover:bg-amber-900">Mystery</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/genres/4" className="cursor-pointer hover:bg-amber-900">Science Fiction</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/genres/5" className="cursor-pointer hover:bg-amber-900">Horror</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/genres/6" className="cursor-pointer hover:bg-amber-900">Adventure</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/genres" className="cursor-pointer hover:bg-amber-900">All Genres</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          
          
          {showRecs && (
             <Link href="/recommendations" className="font-cinzel text-xs xl:text-sm hover:text-amber-500 transition-colors flex items-center gap-1">
               <Award className="h-3 w-3 xl:h-4 xl:w-4" />
               <span className="hidden xl:inline">For You</span>
             </Link>
           )}
          
          {isAuthenticated && isAdmin && (
            <Link href="/admin" className="font-cinzel text-xs xl:text-sm hover:text-amber-500 transition-colors flex items-center gap-1">
              <Shield className="h-3 w-3 xl:h-4 xl:w-4" />
              <span className="hidden xl:inline">Admin</span>
            </Link>
          )}
          
          <a href="https://hekayaty-community.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-cinzel text-xs xl:text-sm hover:text-amber-500 transition-colors flex items-center gap-1">
            <Users className="h-3 w-3 xl:h-4 xl:w-4" />
            <span className="hidden xl:inline">Community</span>
          </a>
          
        </nav>
        
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
          {/* utility icons */}
          {isAuthenticated && !isVip && (
            <Link href="/subscribe" className="hidden lg:inline-flex text-amber-50 hover:text-amber-500">
              <Star className="h-4 w-4 lg:h-5 lg:w-5" />
            </Link>
          )}
          {isAuthenticated && (
             <Link href="/notifications" className="relative hidden lg:inline-flex text-amber-50 hover:text-amber-500">
               <Bell className="h-4 w-4 lg:h-5 lg:w-5" />
               {unreadCount > 0 && (
                 <span className="absolute -top-1 -right-1 bg-red-600 text-[9px] lg:text-[10px] px-1 rounded-full min-w-[16px] h-4 flex items-center justify-center">
                   {unreadCount > 99 ? '99+' : unreadCount}
                 </span>
               )}
             </Link>
           )}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                    <AvatarImage src={user?.avatar} alt={user?.fullName} />
                    <AvatarFallback className="bg-amber-500 text-brown-dark">
                      {user?.fullName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-midnight-blue border-amber-500" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-amber-50">{user?.fullName}</p>
                    <p className="text-xs leading-none text-amber-200">@{user?.username}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${user?.id}`} className="cursor-pointer hover:bg-amber-900">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/workspace" className="cursor-pointer hover:bg-amber-900">Workspace</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer hover:bg-amber-900">Settings</Link>
                </DropdownMenuItem>
                {!user?.isPremium && (
                  <DropdownMenuItem asChild>
                    <Link href="/upgrade" className="cursor-pointer text-amber-500 font-semibold hover:bg-amber-900">Upgrade to Premium</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logout()}
                  className="cursor-pointer hover:bg-amber-900"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden lg:inline-flex text-amber-50 hover:text-amber-500 hover:bg-transparent border border-amber-500 text-xs lg:text-sm px-2 lg:px-4">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="hidden lg:inline-flex bg-amber-500 hover:bg-amber-600 text-brown-dark border-none text-xs lg:text-sm px-2 lg:px-4">
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
          
          {/* Mobile menu button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="lg:hidden p-2 h-10 w-10 sm:h-12 sm:w-12 rounded-full touch-manipulation min-h-[44px] min-w-[44px] hover:bg-amber-500/20 active:bg-amber-500/30 transition-colors">
                <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-amber-50" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-midnight-blue text-amber-50 border-amber-500 w-[85vw] max-w-[350px] sm:w-[320px] safe-area-inset-right">
              <SheetHeader>
                <SheetTitle className="text-amber-50">
                  <Link href="/" onClick={closeMobileMenu} className="inline-flex items-center text-xl sm:text-2xl font-cinzel font-bold mb-4 sm:mb-6">
                    <span className="text-amber-500">Heka</span>yaty
                  </Link>
                </SheetTitle>
                <SheetDescription className="text-amber-200">
                  Explore magical worlds of stories
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 sm:py-6 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-amber-900/20">
                <Link href="/home" onClick={closeMobileMenu} className="flex items-center py-4 px-4 rounded-lg hover:bg-amber-900/50 active:bg-amber-900/70 transition-colors touch-manipulation min-h-[48px] text-base font-medium">
                  <Home className="mr-4 h-6 w-6 text-amber-400" />
                  <span>Home</span>
                </Link>
                {isAuthenticated && user && (
                  <div className="flex items-center space-x-3 mb-4 sm:mb-6 p-3 bg-amber-900/20 rounded-lg">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage src={user.avatar} alt={user.fullName || 'User'} />
                      <AvatarFallback className="bg-amber-500 text-brown-dark text-sm sm:text-base">
                        {user.fullName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">{user.fullName || 'User'}</p>
                      <p className="text-xs sm:text-sm text-amber-300 truncate">@{user.username}</p>
                    </div>
                  </div>
                )}
                
                <Link href="/originals" onClick={closeMobileMenu} className="flex items-center py-4 px-4 rounded-lg hover:bg-amber-900/50 active:bg-amber-900/70 transition-colors touch-manipulation min-h-[48px] text-base font-medium">
                  <BookOpen className="mr-4 h-6 w-6 text-amber-400" />
                  <span>Discover</span>
                </Link>
                
                <Link href="/genres" onClick={closeMobileMenu} className="flex items-center py-4 px-4 rounded-lg hover:bg-amber-900/50 active:bg-amber-900/70 transition-colors touch-manipulation min-h-[48px] text-base font-medium">
                  <Award className="mr-4 h-6 w-6 text-amber-400" />
                  <span>Genres</span>
                </Link>
                <Link href="/subscribe" onClick={closeMobileMenu} className="flex items-center py-4 px-4 rounded-lg hover:bg-amber-900/50 active:bg-amber-900/70 transition-colors touch-manipulation min-h-[48px] text-base font-medium">
                  <Star className="mr-4 h-6 w-6 text-amber-400" />
                  <span>Get Code</span>
                </Link>
                
                
                
                
                {isAuthenticated && isAdmin && (
                  <Link href="/admin" onClick={closeMobileMenu} className="flex items-center py-4 px-4 rounded-lg hover:bg-amber-900/50 active:bg-amber-900/70 transition-colors touch-manipulation min-h-[48px] text-base font-medium">
                    <Shield className="mr-4 h-6 w-6 text-amber-400" />
                    <span>Admin</span>
                  </Link>
                )}
                
                <a href="https://hekayaty-community.vercel.app/" target="_blank" rel="noopener noreferrer" onClick={closeMobileMenu} className="flex items-center py-4 px-4 rounded-lg hover:bg-amber-900/50 active:bg-amber-900/70 transition-colors touch-manipulation min-h-[48px] text-base font-medium">
                  <Users className="mr-4 h-6 w-6 text-amber-400" />
                  <span>Community</span>
                </a>
                
                
                {isAuthenticated ? (
                  <>
                    <div className="border-t border-amber-500/30 pt-4 mt-4">
                      <Link href={`/profile/${user?.id}`} onClick={closeMobileMenu} className="flex items-center py-4 px-4 rounded-lg hover:bg-amber-900/50 active:bg-amber-900/70 transition-colors touch-manipulation min-h-[48px] text-base font-medium">
                        <Users className="mr-4 h-6 w-6 text-amber-400" />
                        <span>Profile</span>
                      </Link>
                      <button 
                        onClick={() => {
                          logout();
                          closeMobileMenu();
                        }}
                        className="w-full text-left flex items-center py-4 px-4 rounded-lg hover:bg-red-900/50 active:bg-red-900/70 transition-colors touch-manipulation min-h-[48px] text-base font-medium text-red-300"
                      >
                        <svg className="mr-4 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="border-t border-amber-500/30 pt-6 mt-6 flex flex-col space-y-3">
                    <Button asChild variant="outline" className="border-amber-500 text-amber-50 hover:bg-amber-900 hover:text-amber-50 min-h-[48px] text-base font-medium touch-manipulation">
                      <Link href="/login" onClick={closeMobileMenu}>Sign In</Link>
                    </Button>
                    <Button asChild className="bg-amber-500 hover:bg-amber-600 text-brown-dark min-h-[48px] text-base font-medium touch-manipulation">
                      <Link href="/register" onClick={closeMobileMenu}>Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
