import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=fe718dbb"; const Fragment = __vite__cjsImport0_react_jsxDevRuntime["Fragment"]; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { playSound } from "/src/lib/audio.ts";
import __vite__cjsImport2_react from "/node_modules/.vite/deps/react.js?v=fe718dbb"; const React = __vite__cjsImport2_react.__esModule ? __vite__cjsImport2_react.default : __vite__cjsImport2_react; const useState = __vite__cjsImport2_react["useState"]; const useEffect = __vite__cjsImport2_react["useEffect"]; const useRef = __vite__cjsImport2_react["useRef"];
import { AppProvider, useApp } from "/src/components/AppContext.tsx";
import { CreatePost } from "/src/components/CreatePost.tsx";
import { PostCard } from "/src/components/PostCard.tsx";
import { Network } from "/src/components/Network.tsx";
import { Leaderboard } from "/src/components/Leaderboard.tsx";
import { Messages } from "/src/components/Messages.tsx";
import { Notifications } from "/src/components/Notifications.tsx";
import { Profile } from "/src/components/Profile.tsx";
import { Account } from "/src/components/Account.tsx";
import { Outlook } from "/src/components/Outlook.tsx";
const MemoizedOutlook = React.memo(Outlook);
import { Journal } from "/src/components/Journal.tsx";
import { Auth } from "/src/components/Auth.tsx";
import { ConnectModal } from "/src/components/ConnectModal.tsx";
import { UserProfile } from "/src/components/UserProfile.tsx";
import { GroupView } from "/src/components/GroupView.tsx";
import { AdminPortal } from "/src/components/AdminPortal.tsx";
import { AdminLogin } from "/src/components/AdminLogin.tsx";
import { RealtimeNotificationBanner } from "/src/components/RealtimeNotificationBanner.tsx";
import { syncPendingInteractionsOnline, getOfflineInteractions } from "/src/utils/offlineSync.ts";
import { TaraptiLogo } from "/src/components/TaraptiLogo.tsx";
import { ErrorBoundary } from "/src/components/ErrorBoundary.tsx";
import {
  Bell,
  MessageSquare,
  Search,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  BookOpen,
  Calendar,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  Activity,
  Handshake,
  X,
  Lock,
  Globe,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  MapPin,
  LogOut,
  Settings,
  Newspaper,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  SquarePen
} from "/node_modules/.vite/deps/lucide-react.js?v=fe718dbb";
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "/node_modules/.vite/deps/recharts.js?v=fe718dbb";
import { AnimatePresence, motion } from "/node_modules/.vite/deps/motion_react.js?v=fe718dbb";
function MainAppLayout() {
  const {
    currentUser,
    setCurrentUser,
    posts,
    fetchPosts,
    notifications,
    fetchNotifications,
    unreadNotificationsCount,
    unreadMessagesCount,
    tradingStats,
    connectedBroker,
    toastMessage,
    setToastMessage,
    showToast,
    activeView,
    setActiveView,
    setActiveChatPartnerId,
    selectedUserId,
    viewUserProfile,
    sessions,
    latestRealtimeEvent,
    clearRealtimeEvent
  } = useApp();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [performanceMetric, setPerformanceMetric] = useState(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ users: [], posts: [] });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [marketNews, setMarketNews] = useState([]);
  const [economicEvents, setEconomicEvents] = useState([]);
  const [activeNewsTab, setActiveNewsTab] = useState("news");
  const [isMessagingExpanded, setIsMessagingExpanded] = useState(false);
  const [isMessagingNewChat, setIsMessagingNewChat] = useState(false);
  const [messagingSearchQuery, setMessagingSearchQuery] = useState("");
  const [messagingUsers, setMessagingUsers] = useState([]);
  useEffect(() => {
    if (isMessagingNewChat) {
      fetch("/api/users").then((r) => {
        if (r.ok && r.headers.get("content-type")?.includes("application/json")) return r.json();
        return [];
      }).then((data) => {
        if (Array.isArray(data)) setMessagingUsers(data);
      }).catch(console.error);
    }
  }, [isMessagingNewChat]);
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news");
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (data.news) setMarketNews(data.news);
            if (data.economicEvents) setEconomicEvents(data.economicEvents);
          }
        }
      } catch (err) {
        console.error("Failed to fetch news:", err);
      }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 6e4);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    import("/src/lib/notifications.ts").then((mod) => mod.requestNotificationPermission());
  }, []);
  const prevUnreadMessagesCount = useRef(unreadMessagesCount);
  const prevUnreadNotificationsCount = useRef(unreadNotificationsCount);
  useEffect(() => {
    if (unreadMessagesCount > prevUnreadMessagesCount.current) {
      playSound();
      import("/src/lib/notifications.ts").then((mod) => mod.showNotification("New Message", "You have a new message"));
    }
    prevUnreadMessagesCount.current = unreadMessagesCount;
  }, [unreadMessagesCount]);
  useEffect(() => {
    if (unreadNotificationsCount > prevUnreadNotificationsCount.current) {
      playSound();
      import("/src/lib/notifications.ts").then((mod) => mod.showNotification("New Notification", "You have a new notification"));
    }
    prevUnreadNotificationsCount.current = unreadNotificationsCount;
  }, [unreadNotificationsCount]);
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef(null);
  const mainRef = useRef(null);
  const refreshPendingCount = async () => {
    const list = await getOfflineInteractions();
    setPendingSyncCount(list.length);
  };
  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBanner(true);
    });
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(() => console.log("Tarapti Service Worker Synchronized.")).catch((err) => console.warn("Service worker registration failed:", err));
    }
    refreshPendingCount();
    const handleOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        setToastMessage("Connected! Syncing queued interactions with Firebase...");
        syncPendingInteractionsOnline(fetchPosts).then((synced) => {
          refreshPendingCount();
          if (synced) {
            setToastMessage("All offline interactions synced with Firebase successfully!");
            setTimeout(() => setToastMessage(null), 4e3);
          } else {
            setTimeout(() => setToastMessage(null), 2e3);
          }
        });
      } else {
        setToastMessage("Offline mode active. Actions will sync once connectivity is restored.");
        setTimeout(() => setToastMessage(null), 4e3);
      }
    };
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);
    const handleOfflineInteraction = () => {
      refreshPendingCount();
      setToastMessage("Saved offline! Your action will auto-sync with Firebase when online.");
      setTimeout(() => setToastMessage(null), 3500);
    };
    window.addEventListener("offline-interaction-queued", handleOfflineInteraction);
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === "INTERACTIONS_SYNCED") {
        console.log("[App.tsx] Service Worker background sync completed!");
        fetchPosts();
        refreshPendingCount();
        setToastMessage("Background Sync Complete! Feed updated.");
        setTimeout(() => setToastMessage(null), 3500);
      }
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    }
    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
      window.removeEventListener("offline-interaction-queued", handleOfflineInteraction);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
    };
  }, []);
  const triggerPwaInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === "accepted") {
          console.log("User installed Tarapti PWA");
        }
        setDeferredPrompt(null);
        setShowPwaBanner(false);
      });
    } else {
      showToast("PWA installation is supported. Add this page to your home screen via browser settings.");
    }
  };
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      fetch(`/api/users?search=${encodeURIComponent(searchQuery)}`).then((res) => {
        if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
          return res.json();
        }
        return [];
      }).then((userData) => {
        fetch(`/api/posts?search=${encodeURIComponent(searchQuery)}`).then((res) => {
          if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
            return res.json();
          }
          return [];
        }).then((postData) => {
          setSearchResults({
            users: Array.isArray(userData) ? userData : [],
            posts: Array.isArray(postData) ? postData : []
          });
        }).catch(() => {
          setSearchResults({ users: Array.isArray(userData) ? userData : [], posts: [] });
        });
      }).catch((err) => {
        console.error("Global search error:", err);
        setSearchResults({ users: [], posts: [] });
      });
    } else {
      setSearchResults({ users: [], posts: [] });
    }
  }, [searchQuery]);
  useEffect(() => {
    const handleScrollEvent = (e) => {
      const target = e.target;
      let currentScrollY = 0;
      if (target === document) {
        currentScrollY = window.scrollY || document.documentElement.scrollTop;
      } else if (target instanceof HTMLElement) {
        currentScrollY = target.scrollTop;
      }
      const prevScrollY = lastScrollY.current;
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (currentScrollY > prevScrollY && currentScrollY > 20) {
        setIsFooterVisible(false);
      } else {
        setIsFooterVisible(true);
      }
      lastScrollY.current = currentScrollY;
      scrollTimeoutRef.current = setTimeout(() => {
        setIsFooterVisible(true);
      }, 350);
    };
    window.addEventListener("scroll", handleScrollEvent, { passive: true });
    const mainEl = mainRef.current;
    if (mainEl) {
      mainEl.addEventListener("scroll", handleScrollEvent, { passive: true });
    }
    return () => {
      window.removeEventListener("scroll", handleScrollEvent);
      if (mainEl) {
        mainEl.removeEventListener("scroll", handleScrollEvent);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [activeView]);
  const [isAdminRoute, setIsAdminRoute] = useState(
    window.location.pathname === "/admin" || window.location.pathname.startsWith("/admin")
  );
  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(window.location.pathname === "/admin" || window.location.pathname.startsWith("/admin"));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const navigateToAdmin = () => {
    window.history.pushState({}, "", "/admin");
    setIsAdminRoute(true);
  };
  const navigateToApp = () => {
    window.history.pushState({}, "", "/");
    setIsAdminRoute(false);
  };
  const handleLogout = () => {
    if (currentUser) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      }).finally(() => {
        setCurrentUser(null);
        localStorage.removeItem("tarapti_user");
        setIsProfileMenuOpen(false);
      });
    }
  };
  if (isAdminRoute) {
    if (!currentUser || currentUser.role !== "admin") {
      return /* @__PURE__ */ jsxDEV(AdminLogin, { onBackToApp: navigateToApp }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 394,
        columnNumber: 14
      }, this);
    }
    return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen bg-slate-950 text-white font-sans flex flex-col relative overflow-x-hidden", children: [
      /* @__PURE__ */ jsxDEV("header", { className: "sticky top-0 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-40 px-6 py-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center space-x-3", children: [
          /* @__PURE__ */ jsxDEV(TaraptiLogo, { height: 50 }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 402,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "h-5 w-[1px] bg-slate-800" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 403,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-black tracking-wider text-indigo-400 uppercase", children: "System Administration Console" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 404,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 401,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center space-x-4", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold text-slate-200 block", children: [
              currentUser.firstName,
              " ",
              currentUser.lastName
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 408,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] text-slate-400", children: [
              "@",
              currentUser.username,
              " • Administrator"
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 409,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 407,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => {
                setCurrentUser(null);
                navigateToApp();
              },
              className: "px-3.5 py-1.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-700 hover:border-rose-900/50 rounded-xl text-[10px] font-bold transition-all",
              children: "Log Out"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 411,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: navigateToApp,
              className: "px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold transition-all shadow-md shadow-indigo-600/10",
              children: "Go to Trader App"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 420,
              columnNumber: 13
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 406,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 400,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex-1 max-w-7xl w-full mx-auto px-6 py-8", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-350", children: /* @__PURE__ */ jsxDEV(AdminPortal, {}, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 432,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 431,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 430,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("footer", { className: "py-6 border-t border-slate-900 bg-slate-950 text-center text-[10px] text-slate-500 font-medium", children: "Tarapti Corporate Networks Inc. • Private Authorized Session" }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 437,
        columnNumber: 9
      }, this),
      toastMessage && /* @__PURE__ */ jsxDEV("div", { className: "fixed bottom-6 right-6 bg-[#121620] border border-gray-800/80 text-gray-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 font-bold text-xs animate-in fade-in slide-in-from-bottom-5 duration-300", children: [
        /* @__PURE__ */ jsxDEV(Activity, { size: 14, className: "text-indigo-400 animate-pulse" }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 444,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "text-center", children: toastMessage }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 445,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 443,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 398,
      columnNumber: 7
    }, this);
  }
  if (!currentUser) {
    return /* @__PURE__ */ jsxDEV(Auth, {}, void 0, false, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 453,
      columnNumber: 12
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: `${activeView !== "messages" ? "h-screen overflow-hidden" : "h-[100dvh] overflow-hidden"} bg-[#f3f2ef] text-black flex flex-col font-sans w-full relative`, children: [
    /* @__PURE__ */ jsxDEV(RealtimeNotificationBanner, { event: latestRealtimeEvent, onDismiss: clearRealtimeEvent }, void 0, false, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 459,
      columnNumber: 7
    }, this),
    activeView !== "messages" && /* @__PURE__ */ jsxDEV("header", { className: "sticky top-0 bg-white border-b border-slate-200 z-40 shrink-0 shadow-sm", children: /* @__PURE__ */ jsxDEV("div", { className: "max-w-[1128px] mx-auto px-4 py-2 pb-1.5 space-y-2", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2.5 mt-1.5", children: /* @__PURE__ */ jsxDEV(TaraptiLogo, { height: 50 }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 469,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 468,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-end gap-2", children: /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3.5", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => setGlobalSearchOpen(true),
              className: "p-1.5 hover:bg-slate-200 rounded-full transition text-slate-500 hover:text-slate-900",
              children: /* @__PURE__ */ jsxDEV(Search, { size: 18 }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 479,
                columnNumber: 15
              }, this)
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 475,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => setActiveView("notifications"),
              className: "p-1.5 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-900 relative",
              children: [
                /* @__PURE__ */ jsxDEV(Bell, { size: 18 }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 486,
                  columnNumber: 15
                }, this),
                unreadNotificationsCount > 0 && /* @__PURE__ */ jsxDEV("span", { className: "absolute -top-1 -right-1 bg-rose-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse", children: unreadNotificationsCount }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 488,
                  columnNumber: 17
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 482,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => setActiveView("messages"),
              className: "p-1.5 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-900 relative",
              children: [
                /* @__PURE__ */ jsxDEV(MessageSquare, { size: 18 }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 498,
                  columnNumber: 15
                }, this),
                unreadMessagesCount > 0 && /* @__PURE__ */ jsxDEV("span", { className: "absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse", children: unreadMessagesCount }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 500,
                  columnNumber: 17
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 494,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDEV("div", { className: "relative", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => setIsProfileMenuOpen(!isProfileMenuOpen),
                className: "w-8 h-8 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-md border-2 border-white overflow-hidden hover:scale-110 transition shrink-0",
                children: currentUser?.avatar && currentUser.avatar.length > 2 ? /* @__PURE__ */ jsxDEV("img", { src: currentUser.avatar, className: "w-full h-full object-cover", alt: "Avatar", referrerPolicy: "no-referrer" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 512,
                  columnNumber: 19
                }, this) : currentUser?.avatar || "👤"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 507,
                columnNumber: 15
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(AnimatePresence, { children: isProfileMenuOpen && /* @__PURE__ */ jsxDEV(Fragment, { children: [
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  className: "fixed inset-0 z-40",
                  onClick: () => setIsProfileMenuOpen(false)
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 522,
                  columnNumber: 21
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                motion.div,
                {
                  initial: { opacity: 0, scale: 0.95, y: 10 },
                  animate: { opacity: 1, scale: 1, y: 0 },
                  exit: { opacity: 0, scale: 0.95, y: 10 },
                  className: "absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden",
                  children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "p-3 border-b border-slate-50 bg-slate-50/50", children: [
                      /* @__PURE__ */ jsxDEV("p", { className: "text-[11px] font-black text-slate-900 truncate", children: [
                        currentUser.firstName,
                        " ",
                        currentUser.lastName
                      ] }, void 0, true, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 534,
                        columnNumber: 25
                      }, this),
                      /* @__PURE__ */ jsxDEV("p", { className: "text-[9px] text-slate-500 truncate", children: [
                        "@",
                        currentUser.username
                      ] }, void 0, true, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 537,
                        columnNumber: 25
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 533,
                      columnNumber: 23
                    }, this),
                    /* @__PURE__ */ jsxDEV("div", { className: "p-1.5", children: [
                      /* @__PURE__ */ jsxDEV(
                        "button",
                        {
                          onClick: () => {
                            setActiveView("profile");
                            setIsProfileMenuOpen(false);
                          },
                          className: "w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition",
                          children: [
                            /* @__PURE__ */ jsxDEV(UserIcon, { size: 14 }, void 0, false, {
                              fileName: "/app/applet/src/App.tsx",
                              lineNumber: 550,
                              columnNumber: 27
                            }, this),
                            "Edit Profile"
                          ]
                        },
                        void 0,
                        true,
                        {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 543,
                          columnNumber: 25
                        },
                        this
                      ),
                      /* @__PURE__ */ jsxDEV(
                        "button",
                        {
                          onClick: handleLogout,
                          className: "w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition",
                          children: [
                            /* @__PURE__ */ jsxDEV(LogOut, { size: 14 }, void 0, false, {
                              fileName: "/app/applet/src/App.tsx",
                              lineNumber: 558,
                              columnNumber: 27
                            }, this),
                            "Logout"
                          ]
                        },
                        void 0,
                        true,
                        {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 554,
                          columnNumber: 25
                        },
                        this
                      )
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 542,
                      columnNumber: 23
                    }, this)
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 527,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 520,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 518,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 506,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 474,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 473,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 467,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "md:hidden space-y-2", children: /* @__PURE__ */ jsxDEV("div", { className: "relative flex items-center", children: [
        /* @__PURE__ */ jsxDEV("button", { className: "text-slate-400 hover:text-slate-900 pr-1 shrink-0", children: /* @__PURE__ */ jsxDEV(ChevronLeft, { size: 16 }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 576,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 575,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("nav", { className: "flex-1 overflow-x-auto no-scrollbar flex items-center justify-center gap-3 text-xs font-bold text-slate-400 select-none pb-0.5", children: [
          { id: "feed", label: "Feed" },
          { id: "network", label: "Network" },
          { id: "leaderboard", label: "Leaderboard" },
          { id: "groups", label: "Community", isCommunity: true },
          ...currentUser?.role === "admin" ? [{ id: "admin", label: "Admin Portal ↗" }] : []
        ].map((tab) => /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => {
              if (tab.id === "admin") {
                navigateToAdmin();
              } else {
                setActiveView(tab.id);
              }
            },
            className: tab.isCommunity ? `py-1 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${activeView === "groups" ? "bg-indigo-50 text-indigo-700 border border-indigo-200/90 font-extrabold shadow-2xs" : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"}` : `py-1 shrink-0 transition relative ${activeView === tab.id ? "text-slate-950 border-b-2 border-slate-950 font-black" : "text-slate-500 hover:text-slate-900"}`,
            children: [
              tab.isCommunity && /* @__PURE__ */ jsxDEV(MapPin, { size: 12, className: activeView === "groups" ? "text-indigo-600" : "text-slate-400" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 610,
                columnNumber: 39
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: tab.label }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 611,
                columnNumber: 19
              }, this)
            ]
          },
          tab.id,
          true,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 587,
            columnNumber: 17
          },
          this
        )) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 579,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("button", { className: "text-slate-400 hover:text-slate-900 pl-1 shrink-0", children: /* @__PURE__ */ jsxDEV(ChevronRight, { size: 16 }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 617,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 616,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 574,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 572,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "hidden md:flex items-center justify-between gap-4 pt-1", children: /* @__PURE__ */ jsxDEV("div", { className: "relative flex items-center flex-1 max-w-xl", children: [
        /* @__PURE__ */ jsxDEV("button", { className: "text-slate-400 hover:text-slate-900 pr-1 shrink-0", children: /* @__PURE__ */ jsxDEV(ChevronLeft, { size: 16 }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 628,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 627,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("nav", { className: "flex-1 overflow-x-auto no-scrollbar flex items-center gap-5 text-xs font-bold text-slate-400 select-none pb-0.5", children: [
          { id: "feed", label: "Feed" },
          { id: "network", label: "Network" },
          { id: "leaderboard", label: "Leaderboard" },
          { id: "groups", label: "Community", isCommunity: true },
          ...currentUser?.role === "admin" ? [{ id: "admin", label: "Admin Portal ↗" }] : []
        ].map((tab) => /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => {
              if (tab.id === "admin") {
                navigateToAdmin();
              } else {
                setActiveView(tab.id);
              }
            },
            className: tab.isCommunity ? `py-1 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${activeView === "groups" ? "bg-indigo-50 text-indigo-700 border border-indigo-200/90 font-extrabold shadow-2xs" : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"}` : `py-1 shrink-0 transition relative ${activeView === tab.id ? "text-slate-950 border-b-2 border-slate-950 font-black" : "text-slate-500 hover:text-slate-900"}`,
            children: [
              tab.isCommunity && /* @__PURE__ */ jsxDEV(MapPin, { size: 12, className: activeView === "groups" ? "text-indigo-600" : "text-slate-400" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 662,
                columnNumber: 39
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: tab.label }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 663,
                columnNumber: 19
              }, this)
            ]
          },
          tab.id,
          true,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 639,
            columnNumber: 17
          },
          this
        )) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 631,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("button", { className: "text-slate-400 hover:text-slate-900 pl-1 shrink-0", children: /* @__PURE__ */ jsxDEV(ChevronRight, { size: 16 }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 669,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 668,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 626,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 624,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 464,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 463,
      columnNumber: 7
    }, this),
    !isOnline && /* @__PURE__ */ jsxDEV("div", { className: "bg-amber-600/10 border-b border-amber-500/25 px-4 py-2 flex items-center justify-between text-amber-400 select-none shrink-0 animate-in slide-in-from-top duration-200 max-w-7xl mx-auto w-full", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "w-2 h-2 rounded-full bg-amber-500 animate-pulse" }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 682,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-extrabold uppercase tracking-wider", children: "Offline Mode Active" }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 683,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 681,
        columnNumber: 11
      }, this),
      pendingSyncCount > 0 && /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30", children: [
        pendingSyncCount,
        " action",
        pendingSyncCount > 1 ? "s" : "",
        " queued"
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 686,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 680,
      columnNumber: 9
    }, this),
    showPwaBanner && /* @__PURE__ */ jsxDEV("div", { className: "bg-gradient-to-r from-indigo-900 to-indigo-800 p-3 mx-4 lg:mx-auto lg:max-w-7xl lg:w-[calc(100%-2rem)] rounded-2xl border border-indigo-500/20 flex items-center justify-between mb-4 mt-4 shadow-lg shrink-0", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxDEV(Sparkles, { size: 16, className: "text-indigo-400 animate-spin" }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 697,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "text-[10px]", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-white block", children: "Install Tarapti Social Network" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 699,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "text-gray-300", children: "Enjoy real-time offline capabilities and instant updates." }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 700,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 698,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 696,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: triggerPwaInstall,
          className: "px-3 py-1 bg-white hover:bg-gray-100 text-indigo-950 font-bold text-[9px] rounded-lg transition",
          children: "Install"
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 703,
          columnNumber: 11
        },
        this
      )
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 695,
      columnNumber: 9
    }, this),
    globalSearchOpen && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col p-4", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-[#121620] border border-gray-800 rounded-2xl w-full max-w-md mx-auto flex flex-col max-h-[85vh] shadow-2xl overflow-hidden mt-12 animate-in fade-in slide-in-from-top-4", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "p-4 border-b border-gray-800/80 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1", children: [
          /* @__PURE__ */ jsxDEV(Search, { size: 14, className: "text-indigo-400" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 719,
            columnNumber: 17
          }, this),
          "Global Search Engine"
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 718,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => {
          setGlobalSearchOpen(false);
          setSearchQuery("");
        }, className: "text-gray-400 hover:text-white", children: /* @__PURE__ */ jsxDEV(X, { size: 18 }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 723,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 722,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 717,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "p-4", children: /* @__PURE__ */ jsxDEV(
        "input",
        {
          type: "text",
          autoFocus: true,
          placeholder: "Search across traders, posts, or tags...",
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          className: "w-full bg-[#181D28] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 728,
          columnNumber: 15
        },
        this
      ) }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 727,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto px-4 pb-4 space-y-4", children: searchQuery.trim().length <= 1 ? /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-gray-500 text-center py-8 italic", children: "Type at least 2 characters to trigger scan..." }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 740,
        columnNumber: 17
      }, this) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
        searchResults.users.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] font-bold text-gray-400 uppercase tracking-widest block", children: "Matched Traders" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 746,
            columnNumber: 23
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 gap-2", children: searchResults.users.map((u) => /* @__PURE__ */ jsxDEV(
            "div",
            {
              onClick: () => {
                viewUserProfile(u.id);
                setGlobalSearchOpen(false);
                setSearchQuery("");
              },
              className: "p-2.5 bg-[#181D28] border border-gray-800 rounded-xl flex items-center gap-2.5 cursor-pointer hover:border-gray-700 transition",
              children: [
                /* @__PURE__ */ jsxDEV("div", { className: "w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs", children: u.avatar }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 754,
                  columnNumber: 29
                }, this),
                /* @__PURE__ */ jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold text-white block leading-tight", children: [
                    u.firstName,
                    " ",
                    u.lastName
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 758,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] text-gray-500", children: [
                    "@",
                    u.username
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 759,
                    columnNumber: 31
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 757,
                  columnNumber: 29
                }, this)
              ]
            },
            u.id,
            true,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 749,
              columnNumber: 27
            },
            this
          )) }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 747,
            columnNumber: 23
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 745,
          columnNumber: 21
        }, this),
        searchResults.posts.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] font-bold text-gray-400 uppercase tracking-widest block", children: "Matched Trading Posts" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 770,
            columnNumber: 23
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-2", children: searchResults.posts.map((p) => /* @__PURE__ */ jsxDEV(
            "div",
            {
              onClick: () => {
                setActiveView("feed");
                setGlobalSearchOpen(false);
              },
              className: "p-3 bg-[#181D28] border border-gray-800 rounded-xl cursor-pointer hover:border-gray-700 transition",
              children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5 mb-1", children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-white", children: p.authorName }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 779,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[8px] text-gray-500", children: [
                    "@",
                    p.authorUsername
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 780,
                    columnNumber: 31
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 778,
                  columnNumber: 29
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-gray-300 line-clamp-2 leading-relaxed", children: p.content }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 782,
                  columnNumber: 29
                }, this)
              ]
            },
            p.id,
            true,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 773,
              columnNumber: 27
            },
            this
          )) }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 771,
            columnNumber: 23
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 769,
          columnNumber: 21
        }, this),
        searchResults.users.length === 0 && searchResults.posts.length === 0 && /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-gray-500 text-center py-8", children: [
          'No results found for "',
          searchQuery,
          '"'
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 790,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 742,
        columnNumber: 17
      }, this) }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 738,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 715,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 714,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: `flex-1 w-full max-w-[1128px] mx-auto flex lg:justify-center lg:gap-6 md:gap-4 overflow-hidden ${activeView !== "messages" ? "lg:pt-6 md:pt-4 lg:px-6 md:px-4" : ""}`, children: [
      activeView !== "messages" && /* @__PURE__ */ jsxDEV("aside", { className: "hidden md:flex flex-col w-[225px] shrink-0 gap-4 overflow-y-auto no-scrollbar pb-10", children: [
        /* @__PURE__ */ jsxDEV(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.4, type: "spring", stiffness: 200, damping: 20 },
            className: "bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm",
            children: [
              /* @__PURE__ */ jsxDEV("div", { className: "h-16 bg-gradient-to-r from-indigo-500 to-purple-600" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 816,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "px-4 pb-4 relative flex flex-col items-center text-center border-b border-slate-100", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "w-16 h-16 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-2xl shadow-md border-4 border-white -mt-8 mb-2 cursor-pointer overflow-hidden", onClick: () => setActiveView("profile"), children: currentUser?.avatar && currentUser.avatar.length > 2 ? /* @__PURE__ */ jsxDEV("img", { src: currentUser.avatar, className: "w-full h-full object-cover", alt: "Avatar", referrerPolicy: "no-referrer" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 820,
                  columnNumber: 21
                }, this) : currentUser?.avatar || "👤" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 818,
                  columnNumber: 17
                }, this),
                /* @__PURE__ */ jsxDEV("h3", { className: "font-bold text-slate-900 leading-tight hover:underline cursor-pointer", onClick: () => setActiveView("profile"), children: [
                  currentUser.firstName,
                  " ",
                  currentUser.lastName
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 825,
                  columnNumber: 17
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-slate-500 mb-1", children: [
                  "@",
                  currentUser.username
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 826,
                  columnNumber: 17
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-slate-600 line-clamp-1", children: currentUser.bio || "Trading enthusiast & community member" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 827,
                  columnNumber: 17
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 817,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "py-3 px-3 flex flex-col gap-2", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between group cursor-pointer", onClick: () => setActiveView("network"), children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-medium text-slate-500 group-hover:underline", children: "Profile viewers" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 831,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-indigo-600", children: "124" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 832,
                    columnNumber: 19
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 830,
                  columnNumber: 17
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between group cursor-pointer", onClick: () => setActiveView("feed"), children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-medium text-slate-500 group-hover:underline", children: "Post impressions" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 835,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-indigo-600", children: "842" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 836,
                    columnNumber: 19
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 834,
                  columnNumber: 17
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 829,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "p-3 border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition", onClick: () => setActiveView("profile"), children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-slate-900", children: "Premium Features" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 840,
                  columnNumber: 17
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-[9px] text-slate-500", children: "Access exclusive trading insights" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 841,
                  columnNumber: 17
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 839,
                columnNumber: 15
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 810,
            columnNumber: 13
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          motion.div,
          {
            initial: "hidden",
            animate: "visible",
            variants: {
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08, delayChildren: 0.15 }
              }
            },
            className: "bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col gap-1.5",
            children: [
              /* @__PURE__ */ jsxDEV(
                motion.button,
                {
                  variants: { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } },
                  onClick: () => setActiveView("feed"),
                  className: `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group active:scale-95 ${activeView === "feed" ? "bg-indigo-50 text-indigo-600 font-bold shadow-sm ring-1 ring-indigo-500/10" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"}`,
                  children: [
                    /* @__PURE__ */ jsxDEV(LayoutDashboard, { size: 18, className: `transition-transform duration-200 ${activeView === "feed" ? "scale-110" : "group-hover:scale-110 group-hover:text-indigo-500"}` }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 863,
                      columnNumber: 17
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "text-sm", children: "Dashboard" }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 864,
                      columnNumber: 17
                    }, this)
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 858,
                  columnNumber: 15
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                motion.div,
                {
                  variants: { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } },
                  className: "flex flex-col",
                  children: [
                    /* @__PURE__ */ jsxDEV("button", { onClick: () => setActiveView("journal"), className: `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group active:scale-95 relative ${activeView === "journal" ? "bg-indigo-50 text-indigo-600 font-bold shadow-sm ring-1 ring-indigo-500/10" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"}`, children: [
                      /* @__PURE__ */ jsxDEV(BookOpen, { size: 18, className: `transition-transform duration-200 ${activeView === "journal" ? "scale-110" : "group-hover:scale-110 group-hover:text-indigo-500"}` }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 872,
                        columnNumber: 19
                      }, this),
                      /* @__PURE__ */ jsxDEV("span", { className: "text-sm", children: "Journal" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 873,
                        columnNumber: 19
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: "absolute right-3 bg-rose-500 text-white rounded-full p-[2px] shadow-sm transition-transform duration-200 group-hover:scale-110", children: /* @__PURE__ */ jsxDEV(Lock, { size: 10 }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 874,
                        columnNumber: 163
                      }, this) }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 874,
                        columnNumber: 19
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 871,
                      columnNumber: 17
                    }, this),
                    /* @__PURE__ */ jsxDEV("div", { className: "pl-10 pr-3 py-1 flex flex-col gap-0.5", children: [
                      /* @__PURE__ */ jsxDEV("button", { onClick: () => setActiveView("journal"), className: "flex items-center text-left py-1.5 px-2 rounded-lg text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:translate-x-1 font-medium transition-all duration-200 active:scale-95", children: "Mission Goal" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 877,
                        columnNumber: 19
                      }, this),
                      /* @__PURE__ */ jsxDEV("button", { onClick: () => setActiveView("journal"), className: "flex items-center text-left py-1.5 px-2 rounded-lg text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:translate-x-1 font-medium transition-all duration-200 active:scale-95", children: "Trading Journal" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 880,
                        columnNumber: 19
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 876,
                      columnNumber: 17
                    }, this)
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 867,
                  columnNumber: 15
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                motion.button,
                {
                  variants: { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } },
                  onClick: () => setActiveView("groups"),
                  className: `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group active:scale-95 ${activeView === "groups" ? "bg-indigo-50 text-indigo-600 font-bold shadow-sm ring-1 ring-indigo-500/10" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"}`,
                  children: [
                    /* @__PURE__ */ jsxDEV(MapPin, { size: 18, className: `transition-transform duration-200 ${activeView === "groups" ? "scale-110 text-indigo-600" : "group-hover:scale-110 group-hover:text-indigo-500"}` }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 891,
                      columnNumber: 17
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "text-sm", children: "Community" }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 892,
                      columnNumber: 17
                    }, this)
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 886,
                  columnNumber: 15
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                motion.button,
                {
                  variants: { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } },
                  onClick: () => setActiveView("account"),
                  className: `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group active:scale-95 ${activeView === "account" ? "bg-indigo-50 text-indigo-600 font-bold shadow-sm ring-1 ring-indigo-500/10" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"}`,
                  children: [
                    /* @__PURE__ */ jsxDEV(ShieldCheck, { size: 18, className: `transition-transform duration-200 ${activeView === "account" ? "scale-110" : "group-hover:scale-110 group-hover:text-indigo-500"}` }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 900,
                      columnNumber: 17
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "text-sm", children: "Account" }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 901,
                      columnNumber: 17
                    }, this)
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 895,
                  columnNumber: 15
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                motion.div,
                {
                  variants: { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } },
                  className: "flex flex-col",
                  children: [
                    /* @__PURE__ */ jsxDEV("button", { onClick: () => setActiveView("outlook"), className: `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group active:scale-95 relative ${activeView === "outlook" ? "bg-indigo-50 text-indigo-600 font-bold shadow-sm ring-1 ring-indigo-500/10" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"}`, children: [
                      /* @__PURE__ */ jsxDEV(Globe, { size: 18, className: `transition-transform duration-200 ${activeView === "outlook" ? "scale-110" : "group-hover:scale-110 group-hover:text-indigo-500"}` }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 909,
                        columnNumber: 19
                      }, this),
                      /* @__PURE__ */ jsxDEV("span", { className: "text-sm", children: "Outlook" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 910,
                        columnNumber: 19
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 908,
                      columnNumber: 17
                    }, this),
                    /* @__PURE__ */ jsxDEV("div", { className: "pl-10 pr-3 py-1 flex flex-col gap-0.5", children: [
                      /* @__PURE__ */ jsxDEV("button", { onClick: () => setActiveView("outlook"), className: "flex items-center text-left py-1.5 px-2 rounded-lg text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:translate-x-1 font-medium transition-all duration-200 active:scale-95", children: "News and Calendar" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 913,
                        columnNumber: 19
                      }, this),
                      /* @__PURE__ */ jsxDEV("button", { onClick: () => setActiveView("outlook"), className: "flex items-center text-left py-1.5 px-2 rounded-lg text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:translate-x-1 font-medium transition-all duration-200 active:scale-95", children: "Technical Analysis" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 916,
                        columnNumber: 19
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 912,
                      columnNumber: 17
                    }, this)
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 904,
                  columnNumber: 15
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(motion.div, { variants: { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }, children: [
                /* @__PURE__ */ jsxDEV("div", { className: "h-px bg-slate-100 my-1 mx-2" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 923,
                  columnNumber: 17
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    onClick: () => setActiveView("profile"),
                    className: `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group active:scale-95 ${activeView === "profile" ? "bg-indigo-50 text-indigo-600 font-bold shadow-sm ring-1 ring-indigo-500/10" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"}`,
                    children: [
                      /* @__PURE__ */ jsxDEV(UserIcon, { size: 18, className: `transition-transform duration-200 ${activeView === "profile" ? "scale-110" : "group-hover:scale-110 group-hover:text-indigo-500"}` }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 932,
                        columnNumber: 19
                      }, this),
                      /* @__PURE__ */ jsxDEV("span", { className: "text-sm", children: "Profile" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 933,
                        columnNumber: 19
                      }, this)
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 924,
                    columnNumber: 17
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 922,
                columnNumber: 15
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 846,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 807,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("main", { ref: mainRef, className: `flex-1 min-w-0 w-full max-w-[555px] h-full overflow-y-auto no-scrollbar ${activeView !== "messages" ? `lg:bg-transparent bg-white shadow-2xl lg:shadow-none border-x lg:border-none border-slate-200 ${activeView === "feed" ? "" : "space-y-4"}` : "overflow-hidden flex flex-col lg:bg-white lg:border lg:border-slate-200 lg:rounded-2xl lg:shadow-sm"}`, children: [
        activeView === "feed" && /* @__PURE__ */ jsxDEV("div", { className: "pb-20 lg:pb-0 bg-white lg:bg-transparent lg:rounded-2xl overflow-hidden", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-300 lg:bg-transparent flex flex-col", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sticky top-0 z-20 pb-2 bg-[#f3f2ef]", children: /* @__PURE__ */ jsxDEV(CreatePost, { onPostCreated: fetchPosts }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 952,
            columnNumber: 17
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 951,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-2 bg-slate-300 lg:bg-transparent flex flex-col", children: posts.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "bg-white p-12 text-center text-gray-500 text-xs", children: "Feed is empty. Be the first to share your trading setups!" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 958,
            columnNumber: 19
          }, this) : posts.map((post) => /* @__PURE__ */ jsxDEV(PostCard, { post, onPostUpdated: fetchPosts }, post.id, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 963,
            columnNumber: 21
          }, this)) }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 956,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 948,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 947,
          columnNumber: 11
        }, this),
        activeView === "network" && /* @__PURE__ */ jsxDEV("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxDEV("h1", { className: "text-xl font-black text-slate-950 mb-4", children: "Network" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 975,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Network, {}, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 976,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 974,
          columnNumber: 11
        }, this),
        activeView === "leaderboard" && /* @__PURE__ */ jsxDEV("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxDEV("h1", { className: "text-xl font-black text-slate-950 mb-4", children: "Leaderboard" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 983,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Leaderboard, {}, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 984,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 982,
          columnNumber: 11
        }, this),
        activeView === "explore" && /* @__PURE__ */ jsxDEV("div", { className: "p-4", children: /* @__PURE__ */ jsxDEV(GroupView, { onBack: () => setActiveView("feed") }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 991,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 990,
          columnNumber: 11
        }, this),
        activeView === "messages" && /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col h-full", children: [
          /* @__PURE__ */ jsxDEV("h1", { className: "text-xl font-black text-slate-950 p-4 border-b", children: "Messages" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 998,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Messages, {}, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 999,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 997,
          columnNumber: 11
        }, this),
        activeView === "notifications" && /* @__PURE__ */ jsxDEV("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxDEV("h1", { className: "text-xl font-black text-slate-950 mb-4", children: "Notifications" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1006,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Notifications, {}, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1007,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1005,
          columnNumber: 11
        }, this),
        activeView === "profile" && /* @__PURE__ */ jsxDEV("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxDEV("h1", { className: "text-xl font-black text-slate-950 mb-4", children: "Profile" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1014,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Profile, {}, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1015,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1013,
          columnNumber: 11
        }, this),
        activeView === "journal" && /* @__PURE__ */ jsxDEV("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxDEV("h1", { className: "text-xl font-black text-slate-950 mb-4", children: "Journal" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1022,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Journal, {}, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1023,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1021,
          columnNumber: 11
        }, this),
        activeView === "account" && /* @__PURE__ */ jsxDEV("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxDEV("h1", { className: "text-xl font-black text-slate-950 mb-4", children: "Account" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1030,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Account, {}, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1031,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1029,
          columnNumber: 11
        }, this),
        activeView === "outlook" && /* @__PURE__ */ jsxDEV("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxDEV("h1", { className: "text-xl font-black text-slate-950 mb-4", children: "Market Outlook" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1038,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(MemoizedOutlook, {}, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1039,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1037,
          columnNumber: 11
        }, this),
        activeView === "user-profile" && selectedUserId && /* @__PURE__ */ jsxDEV("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxDEV("h1", { className: "text-xl font-black text-slate-950 mb-4", children: "User Profile" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1046,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(UserProfile, { userId: selectedUserId, onBack: () => setActiveView("feed") }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1047,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1045,
          columnNumber: 11
        }, this),
        activeView === "admin" && /* @__PURE__ */ jsxDEV("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxDEV("h1", { className: "text-xl font-black text-slate-950 mb-4", children: "Admin Portal" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1054,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(AdminPortal, {}, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1055,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1053,
          columnNumber: 11
        }, this),
        activeView === "groups" && /* @__PURE__ */ jsxDEV("div", { className: "p-4", children: /* @__PURE__ */ jsxDEV(GroupView, { onBack: () => setActiveView("feed") }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1062,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1061,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 942,
        columnNumber: 9
      }, this),
      activeView !== "messages" && /* @__PURE__ */ jsxDEV("aside", { className: "hidden lg:flex flex-col w-[315px] shrink-0 gap-4 overflow-y-auto no-scrollbar pb-10", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "bg-white rounded-2xl border border-slate-200 p-4 shadow-sm", children: [
          /* @__PURE__ */ jsxDEV("h4", { className: "text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDEV(Handshake, { size: 14, className: "text-indigo-500" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1076,
              columnNumber: 17
            }, this),
            "Broker Partners"
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1075,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
            { name: "Gotrade", type: "US Stocks", status: "Connected" },
            { name: "Ajaib", type: "Crypto & Stocks", status: "Connect" }
          ].map((broker, idx) => /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500", children: broker.name[0] }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1086,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("p", { className: "text-xs font-bold text-slate-900", children: broker.name }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1090,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-slate-500", children: broker.type }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1091,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1089,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1085,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("button", { className: `text-[9px] font-bold px-2 py-1 rounded-md transition ${broker.status === "Connected" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`, children: broker.status }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1094,
              columnNumber: 21
            }, this)
          ] }, idx, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1084,
            columnNumber: 19
          }, this)) }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1079,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1074,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-white rounded-2xl border border-slate-200 p-4 shadow-sm", children: [
          /* @__PURE__ */ jsxDEV("h4", { className: "text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDEV(Calendar, { size: 14, className: "text-indigo-500" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1105,
              columnNumber: 17
            }, this),
            "Upcoming Events"
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1104,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
            { title: "NFP Data Release", date: "Tomorrow, 08:30 EST", impact: "High" },
            { title: "FOMC Meeting", date: "Wed, 14:00 EST", impact: "High" }
          ].map((event, idx) => /* @__PURE__ */ jsxDEV("div", { className: "border-l-2 border-indigo-500 pl-3", children: [
            /* @__PURE__ */ jsxDEV("p", { className: "text-xs font-bold text-slate-900", children: event.title }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1114,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-slate-500 mt-0.5", children: event.date }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1115,
              columnNumber: 21
            }, this)
          ] }, idx, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1113,
            columnNumber: 19
          }, this)) }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1108,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1103,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-white rounded-2xl border border-slate-200 p-4 shadow-sm", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 mb-3 relative", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => setActiveNewsTab("news"),
                className: `relative text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition px-2 py-1 z-10 ${activeNewsTab === "news" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`,
                children: [
                  /* @__PURE__ */ jsxDEV(Newspaper, { size: 14, className: `transition-colors ${activeNewsTab === "news" ? "text-indigo-500" : ""}` }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1128,
                    columnNumber: 19
                  }, this),
                  "News"
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1124,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => setActiveNewsTab("calendar"),
                className: `relative text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition px-2 py-1 z-10 ${activeNewsTab === "calendar" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`,
                children: [
                  /* @__PURE__ */ jsxDEV(Calendar, { size: 14, className: `transition-colors ${activeNewsTab === "calendar" ? "text-indigo-500" : ""}` }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1135,
                    columnNumber: 19
                  }, this),
                  "Events"
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1131,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              motion.div,
              {
                className: "absolute top-0 bottom-0 bg-slate-100 rounded-lg z-0",
                initial: false,
                animate: {
                  left: activeNewsTab === "news" ? "0%" : "50%",
                  width: activeNewsTab === "news" ? "82px" : "92px",
                  x: activeNewsTab === "news" ? 0 : 8
                  // Adjust for spacing
                },
                transition: { type: "spring", stiffness: 300, damping: 30 }
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1140,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1123,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "relative overflow-hidden", children: /* @__PURE__ */ jsxDEV(AnimatePresence, { mode: "wait", children: activeNewsTab === "news" ? /* @__PURE__ */ jsxDEV(
            motion.div,
            {
              initial: { opacity: 0, x: -20 },
              animate: { opacity: 1, x: 0 },
              exit: { opacity: 0, x: 20 },
              transition: { duration: 0.2 },
              className: "space-y-3",
              children: marketNews.length > 0 ? marketNews.map((news) => /* @__PURE__ */ jsxDEV("a", { href: news.url, className: "block group", children: [
                /* @__PURE__ */ jsxDEV("p", { className: "text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-2", children: news.title }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1166,
                  columnNumber: 29
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between mt-1.5", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-indigo-500 font-medium", children: news.source }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1169,
                      columnNumber: 33
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-slate-400", children: news.time }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1170,
                      columnNumber: 33
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1168,
                    columnNumber: 31
                  }, this),
                  news.sentiment && /* @__PURE__ */ jsxDEV("div", { className: `flex items-center gap-0.5 text-[10px] font-bold ${news.sentiment.type === "bullish" ? "text-emerald-500" : "text-rose-500"}`, children: [
                    news.sentiment.type === "bullish" ? /* @__PURE__ */ jsxDEV(TrendingUp, { size: 12 }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1174,
                      columnNumber: 72
                    }, this) : /* @__PURE__ */ jsxDEV(TrendingDown, { size: 12 }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1174,
                      columnNumber: 99
                    }, this),
                    news.sentiment.value
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1173,
                    columnNumber: 33
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1167,
                  columnNumber: 29
                }, this)
              ] }, news.id, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1165,
                columnNumber: 27
              }, this)) : /* @__PURE__ */ jsxDEV("div", { className: "space-y-3 animate-pulse", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col gap-1", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "h-4 bg-slate-100 rounded w-full" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1185,
                  columnNumber: 31
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "h-3 bg-slate-100 rounded w-1/2" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1186,
                  columnNumber: 31
                }, this)
              ] }, i, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1184,
                columnNumber: 29
              }, this)) }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1182,
                columnNumber: 25
              }, this)
            },
            "news",
            false,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1155,
              columnNumber: 21
            },
            this
          ) : /* @__PURE__ */ jsxDEV(
            motion.div,
            {
              initial: { opacity: 0, x: 20 },
              animate: { opacity: 1, x: 0 },
              exit: { opacity: 0, x: -20 },
              transition: { duration: 0.2 },
              className: "space-y-2",
              children: economicEvents.length > 0 ? economicEvents.map((event) => /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center min-w-[46px] justify-center bg-slate-50 rounded-lg p-1 shrink-0 border border-slate-100/80", children: [
                  event.date && /* @__PURE__ */ jsxDEV("span", { className: "text-[8px] font-bold text-slate-400 uppercase tracking-tight", children: event.date }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1205,
                    columnNumber: 46
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-black text-slate-800 leading-none my-0.5", children: event.time }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1206,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: `text-[9px] font-black uppercase tracking-wider ${event.currency === "USD" ? "text-emerald-600" : event.currency === "EUR" ? "text-blue-600" : event.currency === "GBP" ? "text-indigo-600" : "text-rose-600"}`, children: event.currency }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1207,
                    columnNumber: 31
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1204,
                  columnNumber: 29
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxDEV("p", { className: "text-[11px] font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition", children: event.event }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1214,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 mt-1", children: [
                    event.impact === "high" && /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-0.5", children: [
                      /* @__PURE__ */ jsxDEV("div", { className: "w-1.5 h-1.5 rounded-full bg-rose-500" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1218,
                        columnNumber: 37
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: "w-1.5 h-1.5 rounded-full bg-rose-500" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1219,
                        columnNumber: 37
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: "w-1.5 h-1.5 rounded-full bg-rose-500" }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1220,
                        columnNumber: 37
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1217,
                      columnNumber: 35
                    }, this),
                    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5 text-[9px] text-slate-500 font-medium", children: [
                      event.actual && /* @__PURE__ */ jsxDEV("span", { children: [
                        "Act: ",
                        /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-slate-900", children: event.actual }, void 0, false, {
                          fileName: "/app/applet/src/App.tsx",
                          lineNumber: 1224,
                          columnNumber: 63
                        }, this)
                      ] }, void 0, true, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1224,
                        columnNumber: 52
                      }, this),
                      event.forecast && /* @__PURE__ */ jsxDEV("span", { children: [
                        "Est: ",
                        event.forecast
                      ] }, void 0, true, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1225,
                        columnNumber: 54
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1223,
                      columnNumber: 33
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1215,
                    columnNumber: 31
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1213,
                  columnNumber: 29
                }, this)
              ] }, event.id, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1203,
                columnNumber: 27
              }, this)) : /* @__PURE__ */ jsxDEV("div", { className: "space-y-3 animate-pulse", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxDEV("div", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "w-8 h-6 bg-slate-100 rounded" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1235,
                  columnNumber: 31
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex-1 space-y-1", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "h-3 bg-slate-100 rounded w-full" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1237,
                    columnNumber: 33
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "h-2 bg-slate-100 rounded w-1/2" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1238,
                    columnNumber: 33
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1236,
                  columnNumber: 31
                }, this)
              ] }, i, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1234,
                columnNumber: 29
              }, this)) }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1232,
                columnNumber: 25
              }, this)
            },
            "calendar",
            false,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1193,
              columnNumber: 21
            },
            this
          ) }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1153,
            columnNumber: 17
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1152,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1122,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "px-2 flex flex-wrap gap-x-3 gap-y-2 text-[10px] font-medium text-slate-400", children: [
          /* @__PURE__ */ jsxDEV("a", { href: "#", className: "hover:text-indigo-600 transition", children: "About" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1252,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("a", { href: "#", className: "hover:text-indigo-600 transition", children: "Accessibility" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1253,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("a", { href: "#", className: "hover:text-indigo-600 transition", children: "Help Center" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1254,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("a", { href: "#", className: "hover:text-indigo-600 transition", children: "Privacy & Terms" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1255,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "w-full pt-2 flex items-center gap-1.5 text-slate-500", children: [
            /* @__PURE__ */ jsxDEV(TaraptiLogo, { height: 22 }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1257,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("span", { children: "© 2026 Tarapti Inc." }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1258,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1256,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1251,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1071,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 803,
      columnNumber: 7
    }, this),
    activeView !== "messages" && /* @__PURE__ */ jsxDEV("footer", { className: `lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 bg-white border-t border-slate-200 py-3 px-4 w-full max-w-lg z-40 shrink-0 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out ${isFooterVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`, children: /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-5 gap-1 text-center", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setActiveView("feed"),
          className: `flex flex-col items-center justify-center gap-1 transition ${activeView === "feed" ? "text-indigo-600" : "text-slate-400 hover:text-slate-900"}`,
          children: [
            /* @__PURE__ */ jsxDEV("div", { className: "h-[22px] flex items-center justify-center relative", children: /* @__PURE__ */ jsxDEV(LayoutDashboard, { size: 18 }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1281,
              columnNumber: 15
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1280,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] font-black", children: "Dashboard" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1283,
              columnNumber: 13
            }, this)
          ]
        },
        void 0,
        true,
        {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1274,
          columnNumber: 11
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setActiveView("journal"),
          className: `flex flex-col items-center justify-center gap-1 transition relative ${activeView === "journal" ? "text-indigo-600" : "text-slate-400 hover:text-slate-900"}`,
          children: [
            /* @__PURE__ */ jsxDEV("div", { className: "h-[22px] flex items-center justify-center relative", children: [
              /* @__PURE__ */ jsxDEV(BookOpen, { size: 18 }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1294,
                columnNumber: 15
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-[2px] border border-white shadow-sm flex items-center justify-center", children: /* @__PURE__ */ jsxDEV(Lock, { size: 7 }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1296,
                columnNumber: 17
              }, this) }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1295,
                columnNumber: 15
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1293,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] font-black", children: "Journal" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1299,
              columnNumber: 13
            }, this)
          ]
        },
        void 0,
        true,
        {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1287,
          columnNumber: 11
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setActiveView("account"),
          className: `flex flex-col items-center justify-center gap-1 transition relative ${activeView === "account" ? "text-indigo-600" : "text-slate-400 hover:text-slate-900"}`,
          children: [
            /* @__PURE__ */ jsxDEV("div", { className: "h-[22px] flex items-center justify-center relative", children: /* @__PURE__ */ jsxDEV(ShieldCheck, { size: 18 }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1310,
              columnNumber: 15
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1309,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] font-black", children: "Account" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1312,
              columnNumber: 13
            }, this)
          ]
        },
        void 0,
        true,
        {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1303,
          columnNumber: 11
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setActiveView("outlook"),
          className: `flex flex-col items-center justify-center gap-1 transition relative ${activeView === "outlook" ? "text-indigo-600" : "text-slate-400 hover:text-slate-900"}`,
          children: [
            /* @__PURE__ */ jsxDEV("div", { className: "h-[22px] flex items-center justify-center relative", children: /* @__PURE__ */ jsxDEV(Globe, { size: 18 }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1323,
              columnNumber: 15
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1322,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] font-black", children: "Outlook" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1325,
              columnNumber: 13
            }, this)
          ]
        },
        void 0,
        true,
        {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1316,
          columnNumber: 11
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setActiveView("profile"),
          className: `flex flex-col items-center justify-center gap-1 transition ${activeView === "profile" ? "text-indigo-600" : "text-slate-400 hover:text-slate-900"}`,
          children: [
            /* @__PURE__ */ jsxDEV("div", { className: "h-[22px] flex items-center justify-center relative", children: /* @__PURE__ */ jsxDEV(UserIcon, { size: 18 }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1336,
              columnNumber: 15
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1335,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] font-black", children: "Profile" }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1338,
              columnNumber: 13
            }, this)
          ]
        },
        void 0,
        true,
        {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1329,
          columnNumber: 11
        },
        this
      )
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 1271,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 1270,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV(
      ConnectModal,
      {
        isOpen: isConnectModalOpen,
        onClose: () => setIsConnectModalOpen(false)
      },
      void 0,
      false,
      {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1346,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(AnimatePresence, { children: performanceMetric && /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV(
        motion.div,
        {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          onClick: () => setPerformanceMetric(null),
          className: "fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1355,
          columnNumber: 13
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        motion.div,
        {
          initial: { x: "100%" },
          animate: { x: 0 },
          exit: { x: "100%" },
          transition: { type: "spring", damping: 25, stiffness: 200 },
          className: `fixed right-4 top-4 bottom-4 w-[85%] max-w-sm z-[120] shadow-2xl flex flex-col rounded-3xl border`,
          style: {
            backgroundColor: performanceMetric === "pl" ? "#F0FDF4" : performanceMetric === "drawdown" ? "#FFCAD0" : performanceMetric === "winrate" ? "#CEF3FC" : "#FFF1F2",
            borderColor: performanceMetric === "pl" ? "#DCFCE7" : performanceMetric === "streak" ? "#FFE4E6" : "#cbd5e1"
          },
          children: [
            /* @__PURE__ */ jsxDEV("div", { className: "p-5 border-b border-black/5 flex items-center justify-between", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("h3", { className: "text-base font-bold text-slate-900", children: performanceMetric === "pl" ? "Your P/L Performance" : performanceMetric === "drawdown" ? "Drawdown Analysis" : performanceMetric === "winrate" ? "Win Rate Statistics" : "Trading Streak" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1382,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-slate-700 font-bold uppercase tracking-widest mt-0.5", children: performanceMetric === "pl" ? "Cumulative Growth" : performanceMetric === "drawdown" ? "Risk Management" : performanceMetric === "winrate" ? "Accuracy Breakdown" : "Consistency Tracker" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1388,
                  columnNumber: 19
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1381,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => setPerformanceMetric(null),
                  className: "w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-black/10 transition-colors",
                  children: /* @__PURE__ */ jsxDEV(X, { size: 18 }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1399,
                    columnNumber: 19
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1395,
                  columnNumber: 17
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1380,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto p-5 space-y-6", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "bg-white/40 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-sm", children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] font-bold text-slate-800 uppercase tracking-wider block mb-1", children: performanceMetric === "pl" ? "Total Gain" : performanceMetric === "drawdown" ? "Max DD" : performanceMetric === "winrate" ? "Total Trades" : "Max Streak" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1406,
                    columnNumber: 21
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "text-xl font-black text-slate-900 font-mono", children: performanceMetric === "pl" ? "+$1,420" : performanceMetric === "drawdown" ? "-4.2%" : performanceMetric === "winrate" ? "142" : "8 Days" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1412,
                    columnNumber: 21
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1405,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "bg-white/40 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-sm", children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] font-bold text-slate-800 uppercase tracking-wider block mb-1", children: performanceMetric === "pl" ? "Win Rate" : performanceMetric === "drawdown" ? "Daily DD" : performanceMetric === "winrate" ? "Win Rate" : "Current" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1420,
                    columnNumber: 21
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "text-xl font-black text-slate-900 font-mono", children: performanceMetric === "pl" ? "68.4%" : performanceMetric === "drawdown" ? "-1.2%" : performanceMetric === "winrate" ? "68.4%" : "3 Days" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1426,
                    columnNumber: 21
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1419,
                  columnNumber: 19
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1404,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-sm", children: /* @__PURE__ */ jsxDEV("div", { className: "h-[220px] w-full", children: /* @__PURE__ */ jsxDEV(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxDEV(
                AreaChart,
                {
                  data: performanceMetric === "pl" ? [
                    { day: "Mon", val: 120 },
                    { day: "Tue", val: 340 },
                    { day: "Wed", val: -150 },
                    { day: "Thu", val: 420 },
                    { day: "Fri", val: 280 },
                    { day: "Sat", val: 510 },
                    { day: "Sun", val: 248 }
                  ] : performanceMetric === "drawdown" ? [
                    { day: "Mon", val: -1.2 },
                    { day: "Tue", val: -0.5 },
                    { day: "Wed", val: -3.4 },
                    { day: "Thu", val: -1.1 },
                    { day: "Fri", val: -0.8 },
                    { day: "Sat", val: -4.2 },
                    { day: "Sun", val: -2.1 }
                  ] : performanceMetric === "winrate" ? [
                    { day: "Mon", val: 60 },
                    { day: "Tue", val: 75 },
                    { day: "Wed", val: 45 },
                    { day: "Thu", val: 82 },
                    { day: "Fri", val: 68 },
                    { day: "Sat", val: 72 },
                    { day: "Sun", val: 65 }
                  ] : [
                    { day: "Mon", val: 2 },
                    { day: "Tue", val: 4 },
                    { day: "Wed", val: 1 },
                    { day: "Thu", val: 5 },
                    { day: "Fri", val: 3 },
                    { day: "Sat", val: 8 },
                    { day: "Sun", val: 3 }
                  ],
                  margin: { top: 10, right: 10, left: -20, bottom: 0 },
                  children: [
                    /* @__PURE__ */ jsxDEV("defs", { children: /* @__PURE__ */ jsxDEV("linearGradient", { id: "colorMetric", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                      /* @__PURE__ */ jsxDEV("stop", { offset: "5%", stopColor: performanceMetric === "drawdown" ? "#E11D48" : "#000", stopOpacity: 0.1 }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1454,
                        columnNumber: 29
                      }, this),
                      /* @__PURE__ */ jsxDEV("stop", { offset: "95%", stopColor: performanceMetric === "drawdown" ? "#E11D48" : "#000", stopOpacity: 0 }, void 0, false, {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1455,
                        columnNumber: 29
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1453,
                      columnNumber: 27
                    }, this) }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1452,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "rgba(0,0,0,0.05)" }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1458,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV(
                      XAxis,
                      {
                        dataKey: "day",
                        axisLine: false,
                        tickLine: false,
                        tick: { fontSize: 10, fontWeight: 700, fill: "rgba(0,0,0,0.4)" },
                        dy: 10
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1459,
                        columnNumber: 25
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV(
                      YAxis,
                      {
                        axisLine: false,
                        tickLine: false,
                        tick: { fontSize: 10, fontWeight: 700, fill: "rgba(0,0,0,0.4)" }
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1466,
                        columnNumber: 25
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV(
                      Tooltip,
                      {
                        contentStyle: {
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                          fontSize: "11px",
                          fontWeight: "600",
                          backgroundColor: "rgba(255, 255, 255, 0.9)"
                        }
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1471,
                        columnNumber: 25
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV(
                      Area,
                      {
                        type: "monotone",
                        dataKey: "val",
                        stroke: performanceMetric === "drawdown" ? "#E11D48" : "rgba(0,0,0,0.5)",
                        strokeWidth: 2,
                        fillOpacity: 1,
                        fill: "url(#colorMetric)"
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/App.tsx",
                        lineNumber: 1481,
                        columnNumber: 25
                      },
                      this
                    )
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1438,
                  columnNumber: 23
                },
                this
              ) }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1437,
                columnNumber: 21
              }, this) }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1436,
                columnNumber: 19
              }, this) }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1435,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxDEV("h4", { className: "text-[10px] font-bold text-slate-800 uppercase tracking-widest", children: performanceMetric === "pl" ? "P/L Insights" : performanceMetric === "drawdown" ? "Risk Insights" : performanceMetric === "winrate" ? "Accuracy Insights" : "Streak Insights" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1495,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex gap-3", children: /* @__PURE__ */ jsxDEV("div", { className: "flex-1 bg-white/40 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-sm", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 mb-1", children: [
                    performanceMetric === "drawdown" ? /* @__PURE__ */ jsxDEV(ShieldAlert, { size: 14, className: "text-rose-600" }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1504,
                      columnNumber: 61
                    }, this) : /* @__PURE__ */ jsxDEV(TrendingUp, { size: 14, className: "text-slate-900" }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1504,
                      columnNumber: 115
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "text-[11px] font-bold text-slate-900", children: performanceMetric === "pl" ? "Best Day" : performanceMetric === "drawdown" ? "Warning" : performanceMetric === "winrate" ? "Top Pair" : "Best Week" }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1505,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1503,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-slate-800 leading-relaxed font-bold", children: performanceMetric === "pl" ? "Saturday yielded maximum returns with +$510 net profit." : performanceMetric === "drawdown" ? "DD peaked at -4.2% on Saturday. Avoid over-leveraging." : performanceMetric === "winrate" ? "XAU/USD maintains your highest win rate at 74%." : "Your 8-day streak in May remains your all-time consistency record." }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1512,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1502,
                  columnNumber: 21
                }, this) }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1501,
                  columnNumber: 19
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1494,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1403,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "p-5 bg-black/5 border-t border-black/5", children: /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => setPerformanceMetric(null),
                className: "w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg",
                children: "Close Insights"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1524,
                columnNumber: 17
              },
              this
            ) }, void 0, false, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1523,
              columnNumber: 15
            }, this)
          ]
        },
        void 0,
        true,
        {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1362,
          columnNumber: 13
        },
        this
      )
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 1354,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 1352,
      columnNumber: 7
    }, this),
    toastMessage && /* @__PURE__ */ jsxDEV("div", { className: "fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#121620] border border-gray-800/80 text-gray-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 max-w-sm w-[90%] justify-center font-bold text-xs animate-in fade-in slide-in-from-bottom-5 duration-300", children: [
      /* @__PURE__ */ jsxDEV(Activity, { size: 14, className: "text-indigo-400 animate-pulse" }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1539,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("span", { className: "text-center", children: toastMessage }, void 0, false, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1540,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 1538,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: `fixed bottom-0 right-4 w-72 bg-white border border-slate-200 rounded-t-lg shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.1)] z-[100] hidden lg:flex flex-col overflow-hidden transition-all duration-300 ${isMessagingExpanded ? "h-[500px]" : "h-12"}`, children: [
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          onClick: () => setIsMessagingExpanded(!isMessagingExpanded),
          className: "px-3 py-2 flex items-center justify-between border-b border-slate-100 cursor-pointer hover:bg-slate-50 shrink-0",
          children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "relative", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "w-8 h-8 rounded-full bg-slate-200 overflow-hidden ring-1 ring-slate-100", children: /* @__PURE__ */ jsxDEV("img", { src: currentUser?.avatar && currentUser.avatar.length > 2 ? currentUser.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.username || "user"}`, alt: "me", className: "w-full h-full object-cover" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1553,
                  columnNumber: 17
                }, this) }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1552,
                  columnNumber: 15
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1555,
                  columnNumber: 15
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1551,
                columnNumber: 13
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-[13px] font-bold text-slate-900", children: "Messaging" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1557,
                columnNumber: 13
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1550,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-0.5", children: [
              /* @__PURE__ */ jsxDEV("button", { className: "p-1.5 hover:bg-slate-100 rounded-full transition", onClick: (e) => {
                e.stopPropagation();
              }, children: /* @__PURE__ */ jsxDEV(MoreHorizontal, { size: 16, className: "text-slate-600" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1560,
                columnNumber: 124
              }, this) }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1560,
                columnNumber: 13
              }, this),
              /* @__PURE__ */ jsxDEV("button", { className: "p-1.5 hover:bg-slate-100 rounded-full transition", onClick: (e) => {
                e.stopPropagation();
                setIsMessagingExpanded(true);
                setIsMessagingNewChat(true);
              }, children: /* @__PURE__ */ jsxDEV(SquarePen, { size: 16, className: "text-slate-600" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1561,
                columnNumber: 183
              }, this) }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1561,
                columnNumber: 13
              }, this),
              /* @__PURE__ */ jsxDEV("button", { className: "p-1.5 hover:bg-slate-100 rounded-full transition", children: isMessagingExpanded ? /* @__PURE__ */ jsxDEV(ChevronDown, { size: 18, className: "text-slate-600" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1563,
                columnNumber: 38
              }, this) : /* @__PURE__ */ jsxDEV(ChevronUp, { size: 18, className: "text-slate-600" }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1563,
                columnNumber: 93
              }, this) }, void 0, false, {
                fileName: "/app/applet/src/App.tsx",
                lineNumber: 1562,
                columnNumber: 13
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1559,
              columnNumber: 11
            }, this)
          ]
        },
        void 0,
        true,
        {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1546,
          columnNumber: 9
        },
        this
      ),
      isMessagingNewChat ? /* @__PURE__ */ jsxDEV("div", { className: "flex-1 flex flex-col overflow-hidden bg-white", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "px-3 py-2 flex items-center justify-between border-b border-slate-100", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-[14px] font-bold text-slate-900", children: "Pesan baru" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1572,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("button", { onClick: () => setIsMessagingNewChat(false), className: "p-1 hover:bg-slate-100 rounded-md text-slate-500", children: /* @__PURE__ */ jsxDEV(X, { size: 16 }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1574,
            columnNumber: 17
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1573,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1571,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "p-2 border-b border-slate-100", children: /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "text",
            placeholder: "Ketik satu nama atau lebih",
            value: messagingSearchQuery,
            onChange: (e) => setMessagingSearchQuery(e.target.value),
            className: "w-full bg-white border border-slate-300 rounded-full py-1.5 px-4 text-[13px] focus:ring-1 focus:ring-indigo-500 outline-none placeholder-slate-500",
            autoFocus: true
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1578,
            columnNumber: 15
          },
          this
        ) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1577,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto no-scrollbar", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "px-3 py-2 text-[12px] font-semibold text-slate-500 bg-slate-50/50", children: "Disarankan" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1588,
            columnNumber: 15
          }, this),
          messagingUsers.filter((u) => u.id !== currentUser?.id && `${u.firstName} ${u.lastName} ${u.username}`.toLowerCase().includes(messagingSearchQuery.toLowerCase())).map((u) => /* @__PURE__ */ jsxDEV(
            "div",
            {
              onClick: () => {
                setActiveView("messages");
                setActiveChatPartnerId(u.id);
                setIsMessagingNewChat(false);
                setIsMessagingExpanded(false);
              },
              className: "px-3 py-2 flex items-center gap-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50/50",
              children: [
                /* @__PURE__ */ jsxDEV("div", { className: "w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0", children: /* @__PURE__ */ jsxDEV("img", { src: u.avatar?.startsWith("http") ? u.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`, className: "w-full h-full object-cover" }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1596,
                  columnNumber: 23
                }, this) }, void 0, false, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1595,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "text-[13px] font-bold text-slate-900 leading-tight truncate", children: [
                    u.firstName,
                    " ",
                    u.lastName
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1599,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "text-[11px] text-slate-500 truncate", children: u.headline || u.bio || "Member of Tarapti" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1600,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1598,
                  columnNumber: 21
                }, this)
              ]
            },
            u.id,
            true,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1590,
              columnNumber: 18
            },
            this
          )),
          messagingUsers.filter((u) => u.id !== currentUser?.id && `${u.firstName} ${u.lastName} ${u.username}`.toLowerCase().includes(messagingSearchQuery.toLowerCase())).length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "px-4 py-8 text-center text-[12px] text-slate-500", children: "Tidak ada pengguna ditemukan." }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1605,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1587,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1570,
        columnNumber: 11
      }, this) : /* @__PURE__ */ jsxDEV("div", { className: "flex-1 flex flex-col overflow-hidden bg-white", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "px-3 py-2", children: /* @__PURE__ */ jsxDEV("div", { className: "relative", children: [
          /* @__PURE__ */ jsxDEV(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1616,
            columnNumber: 18
          }, this),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              placeholder: "Search messages",
              className: "w-full bg-[#eef3f8] border-none rounded-md py-1.5 pl-9 pr-8 text-[13px] focus:ring-1 focus:ring-slate-300 placeholder-slate-500"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1617,
              columnNumber: 18
            },
            this
          ),
          /* @__PURE__ */ jsxDEV("button", { className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900", children: /* @__PURE__ */ jsxDEV(Settings, { size: 14 }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1623,
            columnNumber: 20
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1622,
            columnNumber: 18
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1615,
          columnNumber: 16
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1614,
          columnNumber: 14
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex border-b border-slate-100", children: [
          /* @__PURE__ */ jsxDEV("button", { className: "flex-1 py-2 text-[13px] font-bold text-indigo-600 border-b-2 border-indigo-600", children: "Focused" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1630,
            columnNumber: 16
          }, this),
          /* @__PURE__ */ jsxDEV("button", { className: "flex-1 py-2 text-[13px] font-bold text-slate-500 hover:text-slate-900 transition", children: "Other" }, void 0, false, {
            fileName: "/app/applet/src/App.tsx",
            lineNumber: 1631,
            columnNumber: 16
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1629,
          columnNumber: 14
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto no-scrollbar", children: sessions.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "text-center py-10 px-4 text-xs text-slate-400 font-medium", children: "Belum ada pesan. Cari koneksi di halaman Network." }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1637,
          columnNumber: 18
        }, this) : sessions.map((msg) => {
          const isGroup = msg.userId.startsWith("group_");
          const avatarSrc = isGroup ? void 0 : msg.avatar && msg.avatar.startsWith("http") ? msg.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.username}`;
          const formatTime = (iso) => {
            if (!iso) return "";
            const d = new Date(iso);
            const today = /* @__PURE__ */ new Date();
            if (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
              return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }).replace(":", ".");
            }
            return `${d.getDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]}`;
          };
          return /* @__PURE__ */ jsxDEV(
            "div",
            {
              onClick: () => {
                setActiveView("messages");
                setActiveChatPartnerId(msg.userId);
                setIsMessagingExpanded(false);
              },
              className: "px-3 py-3 flex gap-3 hover:bg-slate-50 cursor-pointer transition border-b border-slate-50/50",
              children: [
                /* @__PURE__ */ jsxDEV("div", { className: "relative shrink-0", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: `w-12 h-12 rounded-full overflow-hidden border border-slate-100 flex items-center justify-center font-bold text-white ${isGroup ? "bg-gradient-to-tr from-indigo-500 to-indigo-700" : "bg-slate-200"}`, children: avatarSrc ? /* @__PURE__ */ jsxDEV("img", { src: avatarSrc, alt: msg.firstName, className: "w-full h-full object-cover" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1663,
                    columnNumber: 39
                  }, this) : msg.avatar }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1662,
                    columnNumber: 24
                  }, this),
                  msg.unreadCount > 0 && /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1666,
                    columnNumber: 26
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1661,
                  columnNumber: 22
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-baseline mb-0.5", children: [
                    /* @__PURE__ */ jsxDEV("h4", { className: "text-[13px] font-bold text-slate-900 truncate", children: [
                      msg.firstName,
                      " ",
                      msg.lastName
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1671,
                      columnNumber: 26
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "text-[11px] text-slate-500 shrink-0 ml-2", children: formatTime(msg.lastMessageTime) }, void 0, false, {
                      fileName: "/app/applet/src/App.tsx",
                      lineNumber: 1672,
                      columnNumber: 26
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1670,
                    columnNumber: 24
                  }, this),
                  /* @__PURE__ */ jsxDEV("p", { className: "text-[11px] text-slate-500 truncate leading-relaxed", children: msg.lastMessage }, void 0, false, {
                    fileName: "/app/applet/src/App.tsx",
                    lineNumber: 1674,
                    columnNumber: 24
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/App.tsx",
                  lineNumber: 1669,
                  columnNumber: 22
                }, this)
              ]
            },
            msg.userId,
            true,
            {
              fileName: "/app/applet/src/App.tsx",
              lineNumber: 1656,
              columnNumber: 20
            },
            this
          );
        }) }, void 0, false, {
          fileName: "/app/applet/src/App.tsx",
          lineNumber: 1635,
          columnNumber: 14
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/App.tsx",
        lineNumber: 1612,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/App.tsx",
      lineNumber: 1545,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "/app/applet/src/App.tsx",
    lineNumber: 457,
    columnNumber: 5
  }, this);
}
export default function App() {
  return /* @__PURE__ */ jsxDEV(ErrorBoundary, { children: /* @__PURE__ */ jsxDEV(AppProvider, { children: /* @__PURE__ */ jsxDEV(MainAppLayout, {}, void 0, false, {
    fileName: "/app/applet/src/App.tsx",
    lineNumber: 1693,
    columnNumber: 9
  }, this) }, void 0, false, {
    fileName: "/app/applet/src/App.tsx",
    lineNumber: 1692,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "/app/applet/src/App.tsx",
    lineNumber: 1691,
    columnNumber: 5
  }, this);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkFwcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFwYWNoZS0yLjBcbiAqL1xuXG5pbXBvcnQgeyBwbGF5U291bmQgfSBmcm9tICcuL2xpYi9hdWRpbyc7XG5pbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUsIHVzZUVmZmVjdCwgdXNlUmVmIH0gZnJvbSAncmVhY3QnO1xuXG4vLyBGb3JjZSByZS1idWlsZFxuaW1wb3J0IHsgQXBwUHJvdmlkZXIsIHVzZUFwcCB9IGZyb20gJy4vY29tcG9uZW50cy9BcHBDb250ZXh0LnRzeCc7XG5pbXBvcnQgeyBDcmVhdGVQb3N0IH0gZnJvbSAnLi9jb21wb25lbnRzL0NyZWF0ZVBvc3QudHN4JztcbmltcG9ydCB7IFBvc3RDYXJkIH0gZnJvbSAnLi9jb21wb25lbnRzL1Bvc3RDYXJkLnRzeCc7XG5pbXBvcnQgeyBOZXR3b3JrIH0gZnJvbSAnLi9jb21wb25lbnRzL05ldHdvcmsudHN4JztcbmltcG9ydCB7IEV4cGxvcmUgfSBmcm9tICcuL2NvbXBvbmVudHMvRXhwbG9yZS50c3gnO1xuaW1wb3J0IHsgTGVhZGVyYm9hcmQgfSBmcm9tICcuL2NvbXBvbmVudHMvTGVhZGVyYm9hcmQudHN4JztcbmltcG9ydCB7IE1lc3NhZ2VzIH0gZnJvbSAnLi9jb21wb25lbnRzL01lc3NhZ2VzLnRzeCc7XG5pbXBvcnQgeyBOb3RpZmljYXRpb25zIH0gZnJvbSAnLi9jb21wb25lbnRzL05vdGlmaWNhdGlvbnMudHN4JztcbmltcG9ydCB7IFByb2ZpbGUgfSBmcm9tICcuL2NvbXBvbmVudHMvUHJvZmlsZS50c3gnO1xuaW1wb3J0IHsgQ29taW5nU29vbiB9IGZyb20gJy4vY29tcG9uZW50cy9Db21pbmdTb29uLnRzeCc7XG5pbXBvcnQgeyBBY2NvdW50IH0gZnJvbSAnLi9jb21wb25lbnRzL0FjY291bnQudHN4JztcbmltcG9ydCB7IE91dGxvb2sgfSBmcm9tICcuL2NvbXBvbmVudHMvT3V0bG9vay50c3gnO1xuY29uc3QgTWVtb2l6ZWRPdXRsb29rID0gUmVhY3QubWVtbyhPdXRsb29rKTtcbmltcG9ydCB7IEpvdXJuYWwgfSBmcm9tICcuL2NvbXBvbmVudHMvSm91cm5hbC50c3gnO1xuaW1wb3J0IHsgQXV0aCB9IGZyb20gJy4vY29tcG9uZW50cy9BdXRoLnRzeCc7XG5pbXBvcnQgeyBDb25uZWN0TW9kYWwgfSBmcm9tICcuL2NvbXBvbmVudHMvQ29ubmVjdE1vZGFsLnRzeCc7XG5pbXBvcnQgeyBVc2VyUHJvZmlsZSB9IGZyb20gJy4vY29tcG9uZW50cy9Vc2VyUHJvZmlsZS50c3gnO1xuaW1wb3J0IHsgR3JvdXBWaWV3IH0gZnJvbSAnLi9jb21wb25lbnRzL0dyb3VwVmlldy50c3gnO1xuaW1wb3J0IHsgQWRtaW5Qb3J0YWwgfSBmcm9tICcuL2NvbXBvbmVudHMvQWRtaW5Qb3J0YWwudHN4JztcbmltcG9ydCB7IEFkbWluTG9naW4gfSBmcm9tICcuL2NvbXBvbmVudHMvQWRtaW5Mb2dpbi50c3gnO1xuaW1wb3J0IHsgUmVhbHRpbWVOb3RpZmljYXRpb25CYW5uZXIgfSBmcm9tICcuL2NvbXBvbmVudHMvUmVhbHRpbWVOb3RpZmljYXRpb25CYW5uZXIudHN4JztcbmltcG9ydCB7IHN5bmNQZW5kaW5nSW50ZXJhY3Rpb25zT25saW5lLCBnZXRPZmZsaW5lSW50ZXJhY3Rpb25zIH0gZnJvbSAnLi91dGlscy9vZmZsaW5lU3luYy50cyc7XG5pbXBvcnQgeyBmb3JtYXRUb0sgfSBmcm9tICcuL3V0aWxzL2Zvcm1hdHRlcnMudHMnO1xuaW1wb3J0IHsgVGFyYXB0aUxvZ28gfSBmcm9tICcuL2NvbXBvbmVudHMvVGFyYXB0aUxvZ28udHN4JztcbmltcG9ydCB7IEVycm9yQm91bmRhcnkgfSBmcm9tICcuL2NvbXBvbmVudHMvRXJyb3JCb3VuZGFyeS50c3gnO1xuXG4vLyBJY29uc1xuaW1wb3J0IHsgXG4gIEJlbGwsIE1lc3NhZ2VTcXVhcmUsIFNlYXJjaCwgQ2hldnJvblJpZ2h0LCBDaGV2cm9uTGVmdCwgXG4gIExheW91dERhc2hib2FyZCwgQm9va09wZW4sIEJyYWluQ2lyY3VpdCwgQ2FsZW5kYXIsIFVzZXIgYXMgVXNlckljb24sIFVzZXJzLFxuICBIZWxwQ2lyY2xlLCBMaW5rLCBTaGllbGRDaGVjaywgSGVhcnQsIFNwYXJrbGVzLCBBY3Rpdml0eSwgSGFuZHNoYWtlLCBJbmZvLCBYLCBIYXNoLFxuICBQZW5jaWwsIExvY2ssIEdsb2JlLCBUcmVuZGluZ1VwLCBUcmVuZGluZ0Rvd24sIENsb2NrLCBTaGllbGRBbGVydCwgU2VuZCwgTWFwUGluLCBMb2dPdXQsXG4gIFNldHRpbmdzLCBOZXdzcGFwZXIsIE1vcmVIb3Jpem9udGFsLCBFeHRlcm5hbExpbmssIENoZXZyb25VcCwgQ2hldnJvbkRvd24sIFNxdWFyZVBlblxufSBmcm9tICdsdWNpZGUtcmVhY3QnO1xuaW1wb3J0IHsgUmVzcG9uc2l2ZUNvbnRhaW5lciwgTGluZUNoYXJ0LCBMaW5lLCBYQXhpcywgWUF4aXMsIENhcnRlc2lhbkdyaWQsIFRvb2x0aXAsIEFyZWFDaGFydCwgQXJlYSB9IGZyb20gJ3JlY2hhcnRzJztcbmltcG9ydCB7IEFuaW1hdGVQcmVzZW5jZSwgbW90aW9uIH0gZnJvbSAnbW90aW9uL3JlYWN0JztcblxudHlwZSBTY3JlZW5WaWV3ID0gJ2ZlZWQnIHwgJ25ldHdvcmsnIHwgJ2xlYWRlcmJvYXJkJyB8ICdleHBsb3JlJyB8ICdtZXNzYWdlcycgfCAnbm90aWZpY2F0aW9ucycgfCAncHJvZmlsZScgfCAnam91cm5hbCcgfCAnYWNjb3VudCcgfCAnb3V0bG9vaycgfCAndXNlci1wcm9maWxlJyB8ICdhZG1pbicgfCAnZ3JvdXBzJztcblxuZnVuY3Rpb24gTWFpbkFwcExheW91dCgpIHtcbiAgY29uc3QgeyBcbiAgICBjdXJyZW50VXNlciwgXG4gICAgc2V0Q3VycmVudFVzZXIsXG4gICAgcG9zdHMsIFxuICAgIGZldGNoUG9zdHMsIFxuICAgIG5vdGlmaWNhdGlvbnMsXG4gICAgZmV0Y2hOb3RpZmljYXRpb25zLFxuICAgIHVucmVhZE5vdGlmaWNhdGlvbnNDb3VudCwgXG4gICAgdW5yZWFkTWVzc2FnZXNDb3VudCxcbiAgICB0cmFkaW5nU3RhdHMsXG4gICAgY29ubmVjdGVkQnJva2VyLFxuICAgIHRvYXN0TWVzc2FnZSxcbiAgICBzZXRUb2FzdE1lc3NhZ2UsXG4gICAgc2hvd1RvYXN0LFxuICAgIGFjdGl2ZVZpZXcsXG4gICAgc2V0QWN0aXZlVmlldyxcbiAgICBzZXRBY3RpdmVDaGF0UGFydG5lcklkLFxuICAgIHNlbGVjdGVkVXNlcklkLFxuICAgIHZpZXdVc2VyUHJvZmlsZSxcbiAgICBzZXNzaW9ucyxcbiAgICBsYXRlc3RSZWFsdGltZUV2ZW50LFxuICAgIGNsZWFyUmVhbHRpbWVFdmVudFxuICB9ID0gdXNlQXBwKCk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgMCk7XG4gIH0sIFthY3RpdmVWaWV3XSk7XG4gIGNvbnN0IFtpc0Nvbm5lY3RNb2RhbE9wZW4sIHNldElzQ29ubmVjdE1vZGFsT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtpc1Byb2ZpbGVNZW51T3Blbiwgc2V0SXNQcm9maWxlTWVudU9wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbcGVyZm9ybWFuY2VNZXRyaWMsIHNldFBlcmZvcm1hbmNlTWV0cmljXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbZ2xvYmFsU2VhcmNoT3Blbiwgc2V0R2xvYmFsU2VhcmNoT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzZWFyY2hRdWVyeSwgc2V0U2VhcmNoUXVlcnldID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbc2VhcmNoUmVzdWx0cywgc2V0U2VhcmNoUmVzdWx0c10gPSB1c2VTdGF0ZTx7IHVzZXJzOiBhbnlbXSwgcG9zdHM6IGFueVtdIH0+KHsgdXNlcnM6IFtdLCBwb3N0czogW10gfSk7XG5cbiAgLy8gUFdBIEluc3RhbGwgRXZlbnQgc2ltdWxhdGlvblxuICBjb25zdCBbZGVmZXJyZWRQcm9tcHQsIHNldERlZmVycmVkUHJvbXB0XSA9IHVzZVN0YXRlPGFueT4obnVsbCk7XG4gIGNvbnN0IFtzaG93UHdhQmFubmVyLCBzZXRTaG93UHdhQmFubmVyXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICAvLyBPZmZsaW5lIFN5bmMgYW5kIE5vdGlmaWNhdGlvbiBTdGF0ZXNcbiAgY29uc3QgW2lzT25saW5lLCBzZXRJc09ubGluZV0gPSB1c2VTdGF0ZShuYXZpZ2F0b3Iub25MaW5lKTtcbiAgY29uc3QgW3BlbmRpbmdTeW5jQ291bnQsIHNldFBlbmRpbmdTeW5jQ291bnRdID0gdXNlU3RhdGUoMCk7XG5cbiAgLy8gTWFya2V0IE5ld3MgU3RhdGUgKG1vY2tlZClcbiAgY29uc3QgW21hcmtldE5ld3MsIHNldE1hcmtldE5ld3NdID0gdXNlU3RhdGU8YW55W10+KFtdKTtcbiAgY29uc3QgW2Vjb25vbWljRXZlbnRzLCBzZXRFY29ub21pY0V2ZW50c10gPSB1c2VTdGF0ZTxhbnlbXT4oW10pO1xuICBjb25zdCBbYWN0aXZlTmV3c1RhYiwgc2V0QWN0aXZlTmV3c1RhYl0gPSB1c2VTdGF0ZTwnbmV3cycgfCAnY2FsZW5kYXInPignbmV3cycpO1xuICBjb25zdCBbaXNNZXNzYWdpbmdFeHBhbmRlZCwgc2V0SXNNZXNzYWdpbmdFeHBhbmRlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtpc01lc3NhZ2luZ05ld0NoYXQsIHNldElzTWVzc2FnaW5nTmV3Q2hhdF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFttZXNzYWdpbmdTZWFyY2hRdWVyeSwgc2V0TWVzc2FnaW5nU2VhcmNoUXVlcnldID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbbWVzc2FnaW5nVXNlcnMsIHNldE1lc3NhZ2luZ1VzZXJzXSA9IHVzZVN0YXRlPGFueVtdPihbXSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoaXNNZXNzYWdpbmdOZXdDaGF0KSB7XG4gICAgICBmZXRjaCgnL2FwaS91c2VycycpXG4gICAgICAgIC50aGVuKHIgPT4ge1xuICAgICAgICAgIGlmIChyLm9rICYmIHIuaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpPy5pbmNsdWRlcygnYXBwbGljYXRpb24vanNvbicpKSByZXR1cm4gci5qc29uKCk7XG4gICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgICBpZihBcnJheS5pc0FycmF5KGRhdGEpKSBzZXRNZXNzYWdpbmdVc2VycyhkYXRhKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuICAgIH1cbiAgfSwgW2lzTWVzc2FnaW5nTmV3Q2hhdF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgLy8gRmV0Y2ggbGl2ZSBtYXJrZXQgbmV3cyBhbmQgZWNvbm9taWMgY2FsZW5kYXIgZnJvbSBzZXJ2ZXJcbiAgICBjb25zdCBmZXRjaE5ld3MgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9uZXdzJyk7XG4gICAgICAgIGlmIChyZXMub2spIHtcbiAgICAgICAgICBjb25zdCBjb250ZW50VHlwZSA9IHJlcy5oZWFkZXJzLmdldCgnY29udGVudC10eXBlJyk7XG4gICAgICAgICAgaWYgKGNvbnRlbnRUeXBlICYmIGNvbnRlbnRUeXBlLmluY2x1ZGVzKCdhcHBsaWNhdGlvbi9qc29uJykpIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICAgICAgaWYgKGRhdGEubmV3cykgc2V0TWFya2V0TmV3cyhkYXRhLm5ld3MpO1xuICAgICAgICAgICAgaWYgKGRhdGEuZWNvbm9taWNFdmVudHMpIHNldEVjb25vbWljRXZlbnRzKGRhdGEuZWNvbm9taWNFdmVudHMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gZmV0Y2ggbmV3czpcIiwgZXJyKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIC8vIEluaXRpYWwgZmV0Y2hcbiAgICBmZXRjaE5ld3MoKTtcblxuICAgIC8vIFBvbGwgZXZlcnkgNjAgc2Vjb25kcyBmb3IgcmVhbC10aW1lIHVwZGF0ZXNcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKGZldGNoTmV3cywgNjAwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgfSwgW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaW1wb3J0KCcuL2xpYi9ub3RpZmljYXRpb25zJykudGhlbihtb2QgPT4gbW9kLnJlcXVlc3ROb3RpZmljYXRpb25QZXJtaXNzaW9uKCkpO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgcHJldlVucmVhZE1lc3NhZ2VzQ291bnQgPSB1c2VSZWYodW5yZWFkTWVzc2FnZXNDb3VudCk7XG4gIGNvbnN0IHByZXZVbnJlYWROb3RpZmljYXRpb25zQ291bnQgPSB1c2VSZWYodW5yZWFkTm90aWZpY2F0aW9uc0NvdW50KTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICh1bnJlYWRNZXNzYWdlc0NvdW50ID4gcHJldlVucmVhZE1lc3NhZ2VzQ291bnQuY3VycmVudCkge1xuICAgICAgICBwbGF5U291bmQoKTtcbiAgICAgICAgaW1wb3J0KCcuL2xpYi9ub3RpZmljYXRpb25zJykudGhlbihtb2QgPT4gbW9kLnNob3dOb3RpZmljYXRpb24oXCJOZXcgTWVzc2FnZVwiLCBcIllvdSBoYXZlIGEgbmV3IG1lc3NhZ2VcIikpO1xuICAgIH1cbiAgICBwcmV2VW5yZWFkTWVzc2FnZXNDb3VudC5jdXJyZW50ID0gdW5yZWFkTWVzc2FnZXNDb3VudDtcbiAgfSwgW3VucmVhZE1lc3NhZ2VzQ291bnRdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICh1bnJlYWROb3RpZmljYXRpb25zQ291bnQgPiBwcmV2VW5yZWFkTm90aWZpY2F0aW9uc0NvdW50LmN1cnJlbnQpIHtcbiAgICAgICAgcGxheVNvdW5kKCk7XG4gICAgICAgIGltcG9ydCgnLi9saWIvbm90aWZpY2F0aW9ucycpLnRoZW4obW9kID0+IG1vZC5zaG93Tm90aWZpY2F0aW9uKFwiTmV3IE5vdGlmaWNhdGlvblwiLCBcIllvdSBoYXZlIGEgbmV3IG5vdGlmaWNhdGlvblwiKSk7XG4gICAgfVxuICAgIHByZXZVbnJlYWROb3RpZmljYXRpb25zQ291bnQuY3VycmVudCA9IHVucmVhZE5vdGlmaWNhdGlvbnNDb3VudDtcbiAgfSwgW3VucmVhZE5vdGlmaWNhdGlvbnNDb3VudF0pO1xuXG4gIC8vIEJvdHRvbSBuYXZpZ2F0aW9uIHZpc2liaWxpdHkgc3RhdGVzIG9uIHNjcm9sbFxuICBjb25zdCBbaXNGb290ZXJWaXNpYmxlLCBzZXRJc0Zvb3RlclZpc2libGVdID0gdXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IGxhc3RTY3JvbGxZID0gdXNlUmVmKDApO1xuICBjb25zdCBzY3JvbGxUaW1lb3V0UmVmID0gdXNlUmVmPE5vZGVKUy5UaW1lb3V0IHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IG1haW5SZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQgfCBudWxsPihudWxsKTtcblxuICBjb25zdCByZWZyZXNoUGVuZGluZ0NvdW50ID0gYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGxpc3QgPSBhd2FpdCBnZXRPZmZsaW5lSW50ZXJhY3Rpb25zKCk7XG4gICAgc2V0UGVuZGluZ1N5bmNDb3VudChsaXN0Lmxlbmd0aCk7XG4gIH07XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmVmb3JlaW5zdGFsbHByb21wdCcsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBzZXREZWZlcnJlZFByb21wdChlKTtcbiAgICAgIHNldFNob3dQd2FCYW5uZXIodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICAvLyBSZWdpc3RlciBzZXJ2aWNlIHdvcmtlciBpZiBhdmFpbGFibGVcbiAgICBpZiAoJ3NlcnZpY2VXb3JrZXInIGluIG5hdmlnYXRvcikge1xuICAgICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy9zdy5qcycpXG4gICAgICAgIC50aGVuKCgpID0+IGNvbnNvbGUubG9nKCdUYXJhcHRpIFNlcnZpY2UgV29ya2VyIFN5bmNocm9uaXplZC4nKSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiBjb25zb2xlLndhcm4oJ1NlcnZpY2Ugd29ya2VyIHJlZ2lzdHJhdGlvbiBmYWlsZWQ6JywgZXJyKSk7XG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbCBjaGVjayBvZiBwZW5kaW5nIGludGVyYWN0aW9ucyB0byBzeW5jXG4gICAgcmVmcmVzaFBlbmRpbmdDb3VudCgpO1xuXG4gICAgY29uc3QgaGFuZGxlT25saW5lU3RhdHVzID0gKCkgPT4ge1xuICAgICAgY29uc3Qgb25saW5lID0gbmF2aWdhdG9yLm9uTGluZTtcbiAgICAgIHNldElzT25saW5lKG9ubGluZSk7XG4gICAgICBpZiAob25saW5lKSB7XG4gICAgICAgIHNldFRvYXN0TWVzc2FnZShcIkNvbm5lY3RlZCEgU3luY2luZyBxdWV1ZWQgaW50ZXJhY3Rpb25zIHdpdGggRmlyZWJhc2UuLi5cIik7XG4gICAgICAgIHN5bmNQZW5kaW5nSW50ZXJhY3Rpb25zT25saW5lKGZldGNoUG9zdHMpLnRoZW4oKHN5bmNlZCkgPT4ge1xuICAgICAgICAgIHJlZnJlc2hQZW5kaW5nQ291bnQoKTtcbiAgICAgICAgICBpZiAoc3luY2VkKSB7XG4gICAgICAgICAgICBzZXRUb2FzdE1lc3NhZ2UoXCJBbGwgb2ZmbGluZSBpbnRlcmFjdGlvbnMgc3luY2VkIHdpdGggRmlyZWJhc2Ugc3VjY2Vzc2Z1bGx5IVwiKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VG9hc3RNZXNzYWdlKG51bGwpLCA0MDAwKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzZXRUb2FzdE1lc3NhZ2UobnVsbCksIDIwMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRUb2FzdE1lc3NhZ2UoXCJPZmZsaW5lIG1vZGUgYWN0aXZlLiBBY3Rpb25zIHdpbGwgc3luYyBvbmNlIGNvbm5lY3Rpdml0eSBpcyByZXN0b3JlZC5cIik7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VG9hc3RNZXNzYWdlKG51bGwpLCA0MDAwKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29ubGluZScsIGhhbmRsZU9ubGluZVN0YXR1cyk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29mZmxpbmUnLCBoYW5kbGVPbmxpbmVTdGF0dXMpO1xuXG4gICAgLy8gTGlzdGVuIHRvIGN1c3RvbSBldmVudCBmaXJlZCB3aGVuIG9mZmxpbmUgaW50ZXJhY3Rpb25zIGFyZSBxdWV1ZWRcbiAgICBjb25zdCBoYW5kbGVPZmZsaW5lSW50ZXJhY3Rpb24gPSAoKSA9PiB7XG4gICAgICByZWZyZXNoUGVuZGluZ0NvdW50KCk7XG4gICAgICBzZXRUb2FzdE1lc3NhZ2UoXCJTYXZlZCBvZmZsaW5lISBZb3VyIGFjdGlvbiB3aWxsIGF1dG8tc3luYyB3aXRoIEZpcmViYXNlIHdoZW4gb25saW5lLlwiKTtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VG9hc3RNZXNzYWdlKG51bGwpLCAzNTAwKTtcbiAgICB9O1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvZmZsaW5lLWludGVyYWN0aW9uLXF1ZXVlZCcsIGhhbmRsZU9mZmxpbmVJbnRlcmFjdGlvbik7XG5cbiAgICAvLyBMaXN0ZW4gdG8gbWVzc2FnZSBjaGFubmVsIGZyb20gU2VydmljZSBXb3JrZXIgYmFja2dyb3VuZCBzeW5jIGNvbXBsZXRpbmdcbiAgICBjb25zdCBoYW5kbGVTZXJ2aWNlV29ya2VyTWVzc2FnZSA9IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZlbnQuZGF0YSAmJiBldmVudC5kYXRhLnR5cGUgPT09ICdJTlRFUkFDVElPTlNfU1lOQ0VEJykge1xuICAgICAgICBjb25zb2xlLmxvZygnW0FwcC50c3hdIFNlcnZpY2UgV29ya2VyIGJhY2tncm91bmQgc3luYyBjb21wbGV0ZWQhJyk7XG4gICAgICAgIGZldGNoUG9zdHMoKTtcbiAgICAgICAgcmVmcmVzaFBlbmRpbmdDb3VudCgpO1xuICAgICAgICBzZXRUb2FzdE1lc3NhZ2UoXCJCYWNrZ3JvdW5kIFN5bmMgQ29tcGxldGUhIEZlZWQgdXBkYXRlZC5cIik7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0VG9hc3RNZXNzYWdlKG51bGwpLCAzNTAwKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGlmICgnc2VydmljZVdvcmtlcicgaW4gbmF2aWdhdG9yKSB7XG4gICAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgaGFuZGxlU2VydmljZVdvcmtlck1lc3NhZ2UpO1xuICAgIH1cblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignb25saW5lJywgaGFuZGxlT25saW5lU3RhdHVzKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdvZmZsaW5lJywgaGFuZGxlT25saW5lU3RhdHVzKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdvZmZsaW5lLWludGVyYWN0aW9uLXF1ZXVlZCcsIGhhbmRsZU9mZmxpbmVJbnRlcmFjdGlvbik7XG4gICAgICBpZiAoJ3NlcnZpY2VXb3JrZXInIGluIG5hdmlnYXRvcikge1xuICAgICAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgaGFuZGxlU2VydmljZVdvcmtlck1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH07XG4gIH0sIFtdKTtcblxuICBjb25zdCB0cmlnZ2VyUHdhSW5zdGFsbCA9ICgpID0+IHtcbiAgICBpZiAoZGVmZXJyZWRQcm9tcHQpIHtcbiAgICAgIGRlZmVycmVkUHJvbXB0LnByb21wdCgpO1xuICAgICAgZGVmZXJyZWRQcm9tcHQudXNlckNob2ljZS50aGVuKChjaG9pY2U6IGFueSkgPT4ge1xuICAgICAgICBpZiAoY2hvaWNlLm91dGNvbWUgPT09ICdhY2NlcHRlZCcpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnVXNlciBpbnN0YWxsZWQgVGFyYXB0aSBQV0EnKTtcbiAgICAgICAgfVxuICAgICAgICBzZXREZWZlcnJlZFByb21wdChudWxsKTtcbiAgICAgICAgc2V0U2hvd1B3YUJhbm5lcihmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2hvd1RvYXN0KCdQV0EgaW5zdGFsbGF0aW9uIGlzIHN1cHBvcnRlZC4gQWRkIHRoaXMgcGFnZSB0byB5b3VyIGhvbWUgc2NyZWVuIHZpYSBicm93c2VyIHNldHRpbmdzLicpO1xuICAgIH1cbiAgfTtcblxuICAvLyBSdW4gR2xvYmFsIHNlYXJjaCBxdWVyeVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChzZWFyY2hRdWVyeS50cmltKCkubGVuZ3RoID4gMSkge1xuICAgICAgLy8gU2VhcmNoIFVzZXJzXG4gICAgICBmZXRjaChgL2FwaS91c2Vycz9zZWFyY2g9JHtlbmNvZGVVUklDb21wb25lbnQoc2VhcmNoUXVlcnkpfWApXG4gICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgaWYgKHJlcy5vayAmJiByZXMuaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpPy5pbmNsdWRlcygnYXBwbGljYXRpb24vanNvbicpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmpzb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbih1c2VyRGF0YSA9PiB7XG4gICAgICAgICAgLy8gU2VhcmNoIFBvc3RzXG4gICAgICAgICAgZmV0Y2goYC9hcGkvcG9zdHM/c2VhcmNoPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHNlYXJjaFF1ZXJ5KX1gKVxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgaWYgKHJlcy5vayAmJiByZXMuaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpPy5pbmNsdWRlcygnYXBwbGljYXRpb24vanNvbicpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5qc29uKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHBvc3REYXRhID0+IHtcbiAgICAgICAgICAgICAgc2V0U2VhcmNoUmVzdWx0cyh7IFxuICAgICAgICAgICAgICAgIHVzZXJzOiBBcnJheS5pc0FycmF5KHVzZXJEYXRhKSA/IHVzZXJEYXRhIDogW10sIFxuICAgICAgICAgICAgICAgIHBvc3RzOiBBcnJheS5pc0FycmF5KHBvc3REYXRhKSA/IHBvc3REYXRhIDogW10gXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCgoKSA9PiB7XG4gICAgICAgICAgICAgIHNldFNlYXJjaFJlc3VsdHMoeyB1c2VyczogQXJyYXkuaXNBcnJheSh1c2VyRGF0YSkgPyB1c2VyRGF0YSA6IFtdLCBwb3N0czogW10gfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkdsb2JhbCBzZWFyY2ggZXJyb3I6XCIsIGVycik7XG4gICAgICAgICAgc2V0U2VhcmNoUmVzdWx0cyh7IHVzZXJzOiBbXSwgcG9zdHM6IFtdIH0pO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0U2VhcmNoUmVzdWx0cyh7IHVzZXJzOiBbXSwgcG9zdHM6IFtdIH0pO1xuICAgIH1cbiAgfSwgW3NlYXJjaFF1ZXJ5XSk7XG5cbiAgLy8gSGFuZGxlIGJvdHRvbSBuYXZpZ2F0aW9uIGF1dG8taGlkZSBhbmQgc2hvdyBvbiBzY3JvbGwgYmVoYXZpb3JcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBoYW5kbGVTY3JvbGxFdmVudCA9IChlOiBFdmVudCkgPT4ge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBEb2N1bWVudDtcbiAgICAgIGxldCBjdXJyZW50U2Nyb2xsWSA9IDA7XG4gICAgICBcbiAgICAgIGlmICh0YXJnZXQgPT09IGRvY3VtZW50KSB7XG4gICAgICAgIGN1cnJlbnRTY3JvbGxZID0gd2luZG93LnNjcm9sbFkgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcDtcbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgY3VycmVudFNjcm9sbFkgPSB0YXJnZXQuc2Nyb2xsVG9wO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwcmV2U2Nyb2xsWSA9IGxhc3RTY3JvbGxZLmN1cnJlbnQ7XG4gICAgICBcbiAgICAgIGlmIChzY3JvbGxUaW1lb3V0UmVmLmN1cnJlbnQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHNjcm9sbFRpbWVvdXRSZWYuY3VycmVudCk7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHNjcm9sbGluZyBkb3duIGFuZCB3ZSBoYXZlIHNjcm9sbGVkIHBhc3QgYSBtaW5pbXVtIG9mIDIwcHgsIGhpZGUgdGhlIGJvdHRvbSBtZW51LlxuICAgICAgLy8gSWYgc2Nyb2xsaW5nIGJhY2sgdXAsIHNob3cgaXQuXG4gICAgICBpZiAoY3VycmVudFNjcm9sbFkgPiBwcmV2U2Nyb2xsWSAmJiBjdXJyZW50U2Nyb2xsWSA+IDIwKSB7XG4gICAgICAgIHNldElzRm9vdGVyVmlzaWJsZShmYWxzZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRJc0Zvb3RlclZpc2libGUodHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIGxhc3RTY3JvbGxZLmN1cnJlbnQgPSBjdXJyZW50U2Nyb2xsWTtcblxuICAgICAgLy8gV2hlbiB0aGUgdXNlciBzdG9wcyBzY3JvbGxpbmcsIHdhaXQgMzUwbXMgYW5kIHNob3cgdGhlIGJvdHRvbSBtZW51IGFnYWluXG4gICAgICBzY3JvbGxUaW1lb3V0UmVmLmN1cnJlbnQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgc2V0SXNGb290ZXJWaXNpYmxlKHRydWUpO1xuICAgICAgfSwgMzUwKTtcbiAgICB9O1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGhhbmRsZVNjcm9sbEV2ZW50LCB7IHBhc3NpdmU6IHRydWUgfSk7XG4gICAgXG4gICAgLy8gQWxzbyBhdHRhY2ggdG8gbWFpbiBlbGVtZW50IHJlZiBzaW5jZSBpdCBoYXMgb3ZlcmZsb3cteS1hdXRvIHN0eWxlXG4gICAgY29uc3QgbWFpbkVsID0gbWFpblJlZi5jdXJyZW50O1xuICAgIGlmIChtYWluRWwpIHtcbiAgICAgIG1haW5FbC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBoYW5kbGVTY3JvbGxFdmVudCwgeyBwYXNzaXZlOiB0cnVlIH0pO1xuICAgIH1cblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgaGFuZGxlU2Nyb2xsRXZlbnQpO1xuICAgICAgaWYgKG1haW5FbCkge1xuICAgICAgICBtYWluRWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgaGFuZGxlU2Nyb2xsRXZlbnQpO1xuICAgICAgfVxuICAgICAgaWYgKHNjcm9sbFRpbWVvdXRSZWYuY3VycmVudCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoc2Nyb2xsVGltZW91dFJlZi5jdXJyZW50KTtcbiAgICAgIH1cbiAgICB9O1xuICB9LCBbYWN0aXZlVmlld10pO1xuXG4gIC8vIFNpbXBsZSBVUkwtYmFzZWQgcm91dGluZyBmb3IgQWRtaW4gUG9ydGFsXG4gIGNvbnN0IFtpc0FkbWluUm91dGUsIHNldElzQWRtaW5Sb3V0ZV0gPSB1c2VTdGF0ZShcbiAgICB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgPT09ICcvYWRtaW4nIHx8IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zdGFydHNXaXRoKCcvYWRtaW4nKVxuICApO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgaGFuZGxlUG9wU3RhdGUgPSAoKSA9PiB7XG4gICAgICBzZXRJc0FkbWluUm91dGUod2luZG93LmxvY2F0aW9uLnBhdGhuYW1lID09PSAnL2FkbWluJyB8fCB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuc3RhcnRzV2l0aCgnL2FkbWluJykpO1xuICAgIH07XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgaGFuZGxlUG9wU3RhdGUpO1xuICAgIHJldHVybiAoKSA9PiB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCBoYW5kbGVQb3BTdGF0ZSk7XG4gIH0sIFtdKTtcblxuICBjb25zdCBuYXZpZ2F0ZVRvQWRtaW4gPSAoKSA9PiB7XG4gICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKHt9LCAnJywgJy9hZG1pbicpO1xuICAgIHNldElzQWRtaW5Sb3V0ZSh0cnVlKTtcbiAgfTtcblxuICBjb25zdCBuYXZpZ2F0ZVRvQXBwID0gKCkgPT4ge1xuICAgIHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZSh7fSwgJycsICcvJyk7XG4gICAgc2V0SXNBZG1pblJvdXRlKGZhbHNlKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVMb2dvdXQgPSAoKSA9PiB7XG4gICAgaWYgKGN1cnJlbnRVc2VyKSB7XG4gICAgICBmZXRjaCgnL2FwaS9hdXRoL2xvZ291dCcsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHVzZXJJZDogY3VycmVudFVzZXIuaWQgfSlcbiAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICBzZXRDdXJyZW50VXNlcihudWxsKTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3RhcmFwdGlfdXNlcicpO1xuICAgICAgICBzZXRJc1Byb2ZpbGVNZW51T3BlbihmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgLy8gSWYgd2UgYXJlIG9uIHRoZSBhZG1pbiByb3V0ZSwgd2UgZGlzcGxheSB0aGUgc3BlY2lhbGl6ZWQgQWRtaW4gZmxvd1xuICBpZiAoaXNBZG1pblJvdXRlKSB7XG4gICAgaWYgKCFjdXJyZW50VXNlciB8fCBjdXJyZW50VXNlci5yb2xlICE9PSAnYWRtaW4nKSB7XG4gICAgICByZXR1cm4gPEFkbWluTG9naW4gb25CYWNrVG9BcHA9e25hdmlnYXRlVG9BcHB9IC8+O1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi1oLXNjcmVlbiBiZy1zbGF0ZS05NTAgdGV4dC13aGl0ZSBmb250LXNhbnMgZmxleCBmbGV4LWNvbCByZWxhdGl2ZSBvdmVyZmxvdy14LWhpZGRlblwiPlxuICAgICAgICB7LyogQWRtaW4gTmF2aWdhdGlvbiBIZWFkZXIgQmFyICovfVxuICAgICAgICA8aGVhZGVyIGNsYXNzTmFtZT1cInN0aWNreSB0b3AtMCBiZy1zbGF0ZS05MDAvODAgYmFja2Ryb3AtYmx1ci1tZCBib3JkZXItYiBib3JkZXItc2xhdGUtODAwIHotNDAgcHgtNiBweS00IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgc3BhY2UteC0zXCI+XG4gICAgICAgICAgICA8VGFyYXB0aUxvZ28gaGVpZ2h0PXs1MH0gLz5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImgtNSB3LVsxcHhdIGJnLXNsYXRlLTgwMFwiIC8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhY2tpbmctd2lkZXIgdGV4dC1pbmRpZ28tNDAwIHVwcGVyY2FzZVwiPlN5c3RlbSBBZG1pbmlzdHJhdGlvbiBDb25zb2xlPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgc3BhY2UteC00XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtcmlnaHRcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS0yMDAgYmxvY2tcIj57Y3VycmVudFVzZXIuZmlyc3ROYW1lfSB7Y3VycmVudFVzZXIubGFzdE5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNDAwXCI+QHtjdXJyZW50VXNlci51c2VybmFtZX0g4oCiIEFkbWluaXN0cmF0b3I8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldEN1cnJlbnRVc2VyKG51bGwpO1xuICAgICAgICAgICAgICAgIG5hdmlnYXRlVG9BcHAoKTtcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMy41IHB5LTEuNSBiZy1zbGF0ZS04MDAgaG92ZXI6Ymctcm9zZS05NTAvNDAgaG92ZXI6dGV4dC1yb3NlLTQwMCBib3JkZXIgYm9yZGVyLXNsYXRlLTcwMCBob3Zlcjpib3JkZXItcm9zZS05MDAvNTAgcm91bmRlZC14bCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGxcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICBMb2cgT3V0XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgb25DbGljaz17bmF2aWdhdGVUb0FwcH1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMy41IHB5LTEuNSBiZy1pbmRpZ28tNjAwIGhvdmVyOmJnLWluZGlnby03MDAgdGV4dC13aGl0ZSByb3VuZGVkLXhsIHRleHQtWzEwcHhdIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBzaGFkb3ctbWQgc2hhZG93LWluZGlnby02MDAvMTBcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICBHbyB0byBUcmFkZXIgQXBwXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9oZWFkZXI+XG5cbiAgICAgICAgey8qIERhc2hib2FyZCBDb250ZW50IENvbnRhaW5lciAoRGVza3RvcCBXaWRlIEdyaWQpICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtYXgtdy03eGwgdy1mdWxsIG14LWF1dG8gcHgtNiBweS04XCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1zbGF0ZS05MDAvNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS04MDAvODAgcm91bmRlZC0zeGwgcC02IHNoYWRvdy0yeGwgYmFja2Ryb3AtYmx1ci1zbSBhbmltYXRlLWluIGZhZGUtaW4gem9vbS1pbi05NSBkdXJhdGlvbi0zNTBcIj5cbiAgICAgICAgICAgIDxBZG1pblBvcnRhbCAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogQWRtaW4gRm9vdGVyICovfVxuICAgICAgICA8Zm9vdGVyIGNsYXNzTmFtZT1cInB5LTYgYm9yZGVyLXQgYm9yZGVyLXNsYXRlLTkwMCBiZy1zbGF0ZS05NTAgdGV4dC1jZW50ZXIgdGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgZm9udC1tZWRpdW1cIj5cbiAgICAgICAgICBUYXJhcHRpIENvcnBvcmF0ZSBOZXR3b3JrcyBJbmMuIOKAoiBQcml2YXRlIEF1dGhvcml6ZWQgU2Vzc2lvblxuICAgICAgICA8L2Zvb3Rlcj5cblxuICAgICAgICB7LyogUHJlbWl1bSBUb2FzdCBOb3RpZmljYXRpb24gb3ZlcmxheSAqL31cbiAgICAgICAge3RvYXN0TWVzc2FnZSAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmaXhlZCBib3R0b20tNiByaWdodC02IGJnLVsjMTIxNjIwXSBib3JkZXIgYm9yZGVyLWdyYXktODAwLzgwIHRleHQtZ3JheS0yMDAgcHgtNCBweS0zIHJvdW5kZWQtMnhsIHNoYWRvdy0yeGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNSB6LTUwIGZvbnQtYm9sZCB0ZXh0LXhzIGFuaW1hdGUtaW4gZmFkZS1pbiBzbGlkZS1pbi1mcm9tLWJvdHRvbS01IGR1cmF0aW9uLTMwMFwiPlxuICAgICAgICAgICAgPEFjdGl2aXR5IHNpemU9ezE0fSBjbGFzc05hbWU9XCJ0ZXh0LWluZGlnby00MDAgYW5pbWF0ZS1wdWxzZVwiIC8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlclwiPnt0b2FzdE1lc3NhZ2V9PC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxuXG4gIGlmICghY3VycmVudFVzZXIpIHtcbiAgICByZXR1cm4gPEF1dGggLz47XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPXtgJHthY3RpdmVWaWV3ICE9PSAnbWVzc2FnZXMnID8gJ2gtc2NyZWVuIG92ZXJmbG93LWhpZGRlbicgOiAnaC1bMTAwZHZoXSBvdmVyZmxvdy1oaWRkZW4nfSBiZy1bI2YzZjJlZl0gdGV4dC1ibGFjayBmbGV4IGZsZXgtY29sIGZvbnQtc2FucyB3LWZ1bGwgcmVsYXRpdmVgfT5cbiAgICAgIHsvKiBSZWFsLXRpbWUgTm90aWZpY2F0aW9uIEZsb2F0aW5nIEJhbm5lciAqL31cbiAgICAgIDxSZWFsdGltZU5vdGlmaWNhdGlvbkJhbm5lciBldmVudD17bGF0ZXN0UmVhbHRpbWVFdmVudH0gb25EaXNtaXNzPXtjbGVhclJlYWx0aW1lRXZlbnR9IC8+XG4gICAgICBcbiAgICAgIHsvKiBHTE9CQUwgSEVBREVSICovfVxuICAgICAge2FjdGl2ZVZpZXcgIT09ICdtZXNzYWdlcycgJiYgKFxuICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJzdGlja3kgdG9wLTAgYmctd2hpdGUgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTIwMCB6LTQwIHNocmluay0wIHNoYWRvdy1zbVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWF4LXctWzExMjhweF0gbXgtYXV0byBweC00IHB5LTIgcGItMS41IHNwYWNlLXktMlwiPlxuICAgICAgICBcbiAgICAgICAgey8qIFRvcCBIZWFkZXIgUm93OiBCcmFuZGluZywgUXVpY2sgU3RhdHMsIEFjdGlvbnMgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1zdGFydCBqdXN0aWZ5LWJldHdlZW5cIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yLjUgbXQtMS41XCI+XG4gICAgICAgICAgICA8VGFyYXB0aUxvZ28gaGVpZ2h0PXs1MH0gLz5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHsvKiBSaWdodCBIZWFkZXIgVHJheSAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgaXRlbXMtZW5kIGdhcC0yXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zLjVcIj5cbiAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEdsb2JhbFNlYXJjaE9wZW4odHJ1ZSl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMS41IGhvdmVyOmJnLXNsYXRlLTIwMCByb3VuZGVkLWZ1bGwgdHJhbnNpdGlvbiB0ZXh0LXNsYXRlLTUwMCBob3Zlcjp0ZXh0LXNsYXRlLTkwMFwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxTZWFyY2ggc2l6ZT17MTh9IC8+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlVmlldygnbm90aWZpY2F0aW9ucycpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTEuNSBob3ZlcjpiZy1zbGF0ZS0yMDAgcm91bmRlZC1mdWxsIHRyYW5zaXRpb24gdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1zbGF0ZS05MDAgcmVsYXRpdmVcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8QmVsbCBzaXplPXsxOH0gLz5cbiAgICAgICAgICAgICAge3VucmVhZE5vdGlmaWNhdGlvbnNDb3VudCA+IDAgJiYgKFxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFic29sdXRlIC10b3AtMSAtcmlnaHQtMSBiZy1yb3NlLTYwMCB0ZXh0LXdoaXRlIHRleHQtWzhweF0gZm9udC1ibGFjayB3LTQgaC00IHJvdW5kZWQtZnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBhbmltYXRlLXB1bHNlXCI+XG4gICAgICAgICAgICAgICAgICB7dW5yZWFkTm90aWZpY2F0aW9uc0NvdW50fVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVWaWV3KCdtZXNzYWdlcycpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTEuNSBob3ZlcjpiZy1zbGF0ZS0yMDAgcm91bmRlZC1mdWxsIHRyYW5zaXRpb24gdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1zbGF0ZS05MDAgcmVsYXRpdmVcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8TWVzc2FnZVNxdWFyZSBzaXplPXsxOH0gLz5cbiAgICAgICAgICAgICAge3VucmVhZE1lc3NhZ2VzQ291bnQgPiAwICYmIChcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhYnNvbHV0ZSAtdG9wLTEgLXJpZ2h0LTEgYmctaW5kaWdvLTYwMCB0ZXh0LXdoaXRlIHRleHQtWzhweF0gZm9udC1ibGFjayB3LTQgaC00IHJvdW5kZWQtZnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBhbmltYXRlLXB1bHNlXCI+XG4gICAgICAgICAgICAgICAgICB7dW5yZWFkTWVzc2FnZXNDb3VudH1cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZVwiPlxuICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldElzUHJvZmlsZU1lbnVPcGVuKCFpc1Byb2ZpbGVNZW51T3Blbil9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy04IGgtOCByb3VuZGVkLXhsIGJnLWluZGlnby02MDAgdGV4dC13aGl0ZSBmb250LWJsYWNrIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQteHMgc2hhZG93LW1kIGJvcmRlci0yIGJvcmRlci13aGl0ZSBvdmVyZmxvdy1oaWRkZW4gaG92ZXI6c2NhbGUtMTEwIHRyYW5zaXRpb24gc2hyaW5rLTBcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge2N1cnJlbnRVc2VyPy5hdmF0YXIgJiYgY3VycmVudFVzZXIuYXZhdGFyLmxlbmd0aCA+IDIgPyAoXG4gICAgICAgICAgICAgICAgICA8aW1nIHNyYz17Y3VycmVudFVzZXIuYXZhdGFyfSBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlclwiIGFsdD1cIkF2YXRhclwiIHJlZmVycmVyUG9saWN5PVwibm8tcmVmZXJyZXJcIiAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICBjdXJyZW50VXNlcj8uYXZhdGFyIHx8IFwi8J+RpFwiXG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgICAgPEFuaW1hdGVQcmVzZW5jZT5cbiAgICAgICAgICAgICAgICB7aXNQcm9maWxlTWVudU9wZW4gJiYgKFxuICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgey8qIEJhY2tkcm9wIHRvIGNsb3NlIG1lbnUgKi99XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZml4ZWQgaW5zZXQtMCB6LTQwXCIgXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0SXNQcm9maWxlTWVudU9wZW4oZmFsc2UpfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgPG1vdGlvbi5kaXZcbiAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHNjYWxlOiAwLjk1LCB5OiAxMCB9fVxuICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgc2NhbGU6IDEsIHk6IDAgfX1cbiAgICAgICAgICAgICAgICAgICAgICBleGl0PXt7IG9wYWNpdHk6IDAsIHNjYWxlOiAwLjk1LCB5OiAxMCB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImFic29sdXRlIHJpZ2h0LTAgbXQtMiB3LTQ4IGJnLXdoaXRlIHJvdW5kZWQtMnhsIHNoYWRvdy0yeGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0xMDAgei01MCBvdmVyZmxvdy1oaWRkZW5cIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTMgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTUwIGJnLXNsYXRlLTUwLzUwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSBmb250LWJsYWNrIHRleHQtc2xhdGUtOTAwIHRydW5jYXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtjdXJyZW50VXNlci5maXJzdE5hbWV9IHtjdXJyZW50VXNlci5sYXN0TmFtZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1zbGF0ZS01MDAgdHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgQHtjdXJyZW50VXNlci51c2VybmFtZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVWaWV3KCdwcm9maWxlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0SXNQcm9maWxlTWVudU9wZW4oZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNSBweC0zIHB5LTIgdGV4dC1bMTFweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtNzAwIGhvdmVyOmJnLXNsYXRlLTUwIGhvdmVyOnRleHQtaW5kaWdvLTYwMCByb3VuZGVkLXhsIHRyYW5zaXRpb25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8VXNlckljb24gc2l6ZT17MTR9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIEVkaXQgUHJvZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlTG9nb3V0fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNSBweC0zIHB5LTIgdGV4dC1bMTFweF0gZm9udC1ib2xkIHRleHQtcm9zZS02MDAgaG92ZXI6Ymctcm9zZS01MCByb3VuZGVkLXhsIHRyYW5zaXRpb25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8TG9nT3V0IHNpemU9ezE0fSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBMb2dvdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L21vdGlvbi5kaXY+XG4gICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8L0FuaW1hdGVQcmVzZW5jZT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogTU9CSUxFIE9OTFk6IENlbnRlciBIZWFkZXIgTmF2aWdhdGlvbiAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtZDpoaWRkZW4gc3BhY2UteS0yXCI+XG4gICAgICAgICAgey8qIENlbnRlciBIZWFkZXIgTmF2aWdhdGlvbiAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIGZsZXggaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtc2xhdGUtOTAwIHByLTEgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgPENoZXZyb25MZWZ0IHNpemU9ezE2fSAvPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIDxuYXYgY2xhc3NOYW1lPVwiZmxleC0xIG92ZXJmbG93LXgtYXV0byBuby1zY3JvbGxiYXIgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTMgdGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS00MDAgc2VsZWN0LW5vbmUgcGItMC41XCI+XG4gICAgICAgICAgICAgIHtbXG4gICAgICAgICAgICAgICAgeyBpZDogJ2ZlZWQnLCBsYWJlbDogJ0ZlZWQnIH0sXG4gICAgICAgICAgICAgICAgeyBpZDogJ25ldHdvcmsnLCBsYWJlbDogJ05ldHdvcmsnIH0sXG4gICAgICAgICAgICAgICAgeyBpZDogJ2xlYWRlcmJvYXJkJywgbGFiZWw6ICdMZWFkZXJib2FyZCcgfSxcbiAgICAgICAgICAgICAgICB7IGlkOiAnZ3JvdXBzJywgbGFiZWw6ICdDb21tdW5pdHknLCBpc0NvbW11bml0eTogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgIC4uLihjdXJyZW50VXNlcj8ucm9sZSA9PT0gJ2FkbWluJyA/IFt7IGlkOiAnYWRtaW4nLCBsYWJlbDogJ0FkbWluIFBvcnRhbCDihpcnIH1dIDogW10pXG4gICAgICAgICAgICAgIF0ubWFwKHRhYiA9PiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAga2V5PXt0YWIuaWR9XG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0YWIuaWQgPT09ICdhZG1pbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0ZVRvQWRtaW4oKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVWaWV3KHRhYi5pZCBhcyBhbnkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtcbiAgICAgICAgICAgICAgICAgICAgdGFiLmlzQ29tbXVuaXR5XG4gICAgICAgICAgICAgICAgICAgICAgPyBgcHktMSBweC0yLjUgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIHNocmluay0wICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZVZpZXcgPT09ICdncm91cHMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctaW5kaWdvLTUwIHRleHQtaW5kaWdvLTcwMCBib3JkZXIgYm9yZGVyLWluZGlnby0yMDAvOTAgZm9udC1leHRyYWJvbGQgc2hhZG93LTJ4cydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy1zbGF0ZS01MCB0ZXh0LXNsYXRlLTYwMCBob3ZlcjpiZy1zbGF0ZS0xMDAgaG92ZXI6dGV4dC1zbGF0ZS05MDAgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAvNjAnXG4gICAgICAgICAgICAgICAgICAgICAgICB9YFxuICAgICAgICAgICAgICAgICAgICAgIDogYHB5LTEgc2hyaW5rLTAgdHJhbnNpdGlvbiByZWxhdGl2ZSAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVWaWV3ID09PSB0YWIuaWQgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAndGV4dC1zbGF0ZS05NTAgYm9yZGVyLWItMiBib3JkZXItc2xhdGUtOTUwIGZvbnQtYmxhY2snIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ3RleHQtc2xhdGUtNTAwIGhvdmVyOnRleHQtc2xhdGUtOTAwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfWBcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7dGFiLmlzQ29tbXVuaXR5ICYmIDxNYXBQaW4gc2l6ZT17MTJ9IGNsYXNzTmFtZT17YWN0aXZlVmlldyA9PT0gJ2dyb3VwcycgPyAndGV4dC1pbmRpZ28tNjAwJyA6ICd0ZXh0LXNsYXRlLTQwMCd9IC8+fVxuICAgICAgICAgICAgICAgICAgPHNwYW4+e3RhYi5sYWJlbH08L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgPC9uYXY+XG5cbiAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1zbGF0ZS05MDAgcGwtMSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICA8Q2hldnJvblJpZ2h0IHNpemU9ezE2fSAvPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIFdFQiBPTkxZOiBDZW50ZXIgTmF2aWdhdGlvbiBhbGlnbmVkIHNpZGUtYnktc2lkZSAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRkZW4gbWQ6ZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC00IHB0LTFcIj5cbiAgICAgICAgICB7LyogTmF2aWdhdGlvbiBsZWZ0LWNlbnRlcmVkICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgZmxleCBpdGVtcy1jZW50ZXIgZmxleC0xIG1heC13LXhsXCI+XG4gICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtc2xhdGUtOTAwIHByLTEgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgPENoZXZyb25MZWZ0IHNpemU9ezE2fSAvPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIDxuYXYgY2xhc3NOYW1lPVwiZmxleC0xIG92ZXJmbG93LXgtYXV0byBuby1zY3JvbGxiYXIgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTUgdGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS00MDAgc2VsZWN0LW5vbmUgcGItMC41XCI+XG4gICAgICAgICAgICAgIHtbXG4gICAgICAgICAgICAgICAgeyBpZDogJ2ZlZWQnLCBsYWJlbDogJ0ZlZWQnIH0sXG4gICAgICAgICAgICAgICAgeyBpZDogJ25ldHdvcmsnLCBsYWJlbDogJ05ldHdvcmsnIH0sXG4gICAgICAgICAgICAgICAgeyBpZDogJ2xlYWRlcmJvYXJkJywgbGFiZWw6ICdMZWFkZXJib2FyZCcgfSxcbiAgICAgICAgICAgICAgICB7IGlkOiAnZ3JvdXBzJywgbGFiZWw6ICdDb21tdW5pdHknLCBpc0NvbW11bml0eTogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgIC4uLihjdXJyZW50VXNlcj8ucm9sZSA9PT0gJ2FkbWluJyA/IFt7IGlkOiAnYWRtaW4nLCBsYWJlbDogJ0FkbWluIFBvcnRhbCDihpcnIH1dIDogW10pXG4gICAgICAgICAgICAgIF0ubWFwKHRhYiA9PiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAga2V5PXt0YWIuaWR9XG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0YWIuaWQgPT09ICdhZG1pbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0ZVRvQWRtaW4oKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVWaWV3KHRhYi5pZCBhcyBhbnkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtcbiAgICAgICAgICAgICAgICAgICAgdGFiLmlzQ29tbXVuaXR5XG4gICAgICAgICAgICAgICAgICAgICAgPyBgcHktMSBweC0yLjUgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgc2hyaW5rLTAgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlVmlldyA9PT0gJ2dyb3VwcydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1pbmRpZ28tNTAgdGV4dC1pbmRpZ28tNzAwIGJvcmRlciBib3JkZXItaW5kaWdvLTIwMC85MCBmb250LWV4dHJhYm9sZCBzaGFkb3ctMnhzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXNsYXRlLTUwIHRleHQtc2xhdGUtNjAwIGhvdmVyOmJnLXNsYXRlLTEwMCBob3Zlcjp0ZXh0LXNsYXRlLTkwMCBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMC82MCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1gXG4gICAgICAgICAgICAgICAgICAgICAgOiBgcHktMSBzaHJpbmstMCB0cmFuc2l0aW9uIHJlbGF0aXZlICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZVZpZXcgPT09IHRhYi5pZCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICd0ZXh0LXNsYXRlLTk1MCBib3JkZXItYi0yIGJvcmRlci1zbGF0ZS05NTAgZm9udC1ibGFjaycgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAndGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC1zbGF0ZS05MDAnXG4gICAgICAgICAgICAgICAgICAgICAgICB9YFxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHt0YWIuaXNDb21tdW5pdHkgJiYgPE1hcFBpbiBzaXplPXsxMn0gY2xhc3NOYW1lPXthY3RpdmVWaWV3ID09PSAnZ3JvdXBzJyA/ICd0ZXh0LWluZGlnby02MDAnIDogJ3RleHQtc2xhdGUtNDAwJ30gLz59XG4gICAgICAgICAgICAgICAgICA8c3Bhbj57dGFiLmxhYmVsfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICA8L25hdj5cblxuICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXNsYXRlLTkwMCBwbC0xIHNocmluay0wXCI+XG4gICAgICAgICAgICAgIDxDaGV2cm9uUmlnaHQgc2l6ZT17MTZ9IC8+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIFxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvaGVhZGVyPlxuICAgICAgKX1cblxuICAgICAgey8qIE9mZmxpbmUgU3RhdHVzIEFsZXJ0IGJhciAqL31cbiAgICAgIHshaXNPbmxpbmUgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLWFtYmVyLTYwMC8xMCBib3JkZXItYiBib3JkZXItYW1iZXItNTAwLzI1IHB4LTQgcHktMiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gdGV4dC1hbWJlci00MDAgc2VsZWN0LW5vbmUgc2hyaW5rLTAgYW5pbWF0ZS1pbiBzbGlkZS1pbi1mcm9tLXRvcCBkdXJhdGlvbi0yMDAgbWF4LXctN3hsIG14LWF1dG8gdy1mdWxsXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidy0yIGgtMiByb3VuZGVkLWZ1bGwgYmctYW1iZXItNTAwIGFuaW1hdGUtcHVsc2VcIiAvPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1leHRyYWJvbGQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+T2ZmbGluZSBNb2RlIEFjdGl2ZTwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICB7cGVuZGluZ1N5bmNDb3VudCA+IDAgJiYgKFxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSBmb250LWJvbGQgYmctYW1iZXItNTAwLzIwIHB4LTIgcHktMC41IHJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMFwiPlxuICAgICAgICAgICAgICB7cGVuZGluZ1N5bmNDb3VudH0gYWN0aW9ue3BlbmRpbmdTeW5jQ291bnQgPiAxID8gJ3MnIDogJyd9IHF1ZXVlZFxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIFBXQSBJTlNUQUxMQVRJT04gQkFOTkVSICovfVxuICAgICAge3Nob3dQd2FCYW5uZXIgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLWdyYWRpZW50LXRvLXIgZnJvbS1pbmRpZ28tOTAwIHRvLWluZGlnby04MDAgcC0zIG14LTQgbGc6bXgtYXV0byBsZzptYXgtdy03eGwgbGc6dy1bY2FsYygxMDAlLTJyZW0pXSByb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLWluZGlnby01MDAvMjAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIG1iLTQgbXQtNCBzaGFkb3ctbGcgc2hyaW5rLTBcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICA8U3BhcmtsZXMgc2l6ZT17MTZ9IGNsYXNzTmFtZT1cInRleHQtaW5kaWdvLTQwMCBhbmltYXRlLXNwaW5cIiAvPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XVwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC13aGl0ZSBibG9ja1wiPkluc3RhbGwgVGFyYXB0aSBTb2NpYWwgTmV0d29yazwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1ncmF5LTMwMFwiPkVuam95IHJlYWwtdGltZSBvZmZsaW5lIGNhcGFiaWxpdGllcyBhbmQgaW5zdGFudCB1cGRhdGVzLjwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIG9uQ2xpY2s9e3RyaWdnZXJQd2FJbnN0YWxsfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xIGJnLXdoaXRlIGhvdmVyOmJnLWdyYXktMTAwIHRleHQtaW5kaWdvLTk1MCBmb250LWJvbGQgdGV4dC1bOXB4XSByb3VuZGVkLWxnIHRyYW5zaXRpb25cIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIEluc3RhbGxcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogR0xPQkFMIFNFQVJDSCBPVkVSTEFZIE1PREFMICovfVxuICAgICAge2dsb2JhbFNlYXJjaE9wZW4gJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGluc2V0LTAgYmctYmxhY2svNjAgYmFja2Ryb3AtYmx1ci1zbSB6LTUwIGZsZXggZmxleC1jb2wgcC00XCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzEyMTYyMF0gYm9yZGVyIGJvcmRlci1ncmF5LTgwMCByb3VuZGVkLTJ4bCB3LWZ1bGwgbWF4LXctbWQgbXgtYXV0byBmbGV4IGZsZXgtY29sIG1heC1oLVs4NXZoXSBzaGFkb3ctMnhsIG92ZXJmbG93LWhpZGRlbiBtdC0xMiBhbmltYXRlLWluIGZhZGUtaW4gc2xpZGUtaW4tZnJvbS10b3AtNFwiPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNCBib3JkZXItYiBib3JkZXItZ3JheS04MDAvODAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtd2hpdGUgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgPFNlYXJjaCBzaXplPXsxNH0gY2xhc3NOYW1lPVwidGV4dC1pbmRpZ28tNDAwXCIgLz5cbiAgICAgICAgICAgICAgICBHbG9iYWwgU2VhcmNoIEVuZ2luZVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17KCkgPT4geyBzZXRHbG9iYWxTZWFyY2hPcGVuKGZhbHNlKTsgc2V0U2VhcmNoUXVlcnkoJycpOyB9fSBjbGFzc05hbWU9XCJ0ZXh0LWdyYXktNDAwIGhvdmVyOnRleHQtd2hpdGVcIj5cbiAgICAgICAgICAgICAgICA8WCBzaXplPXsxOH0gLz5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTRcIj5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiU2VhcmNoIGFjcm9zcyB0cmFkZXJzLCBwb3N0cywgb3IgdGFncy4uLlwiXG4gICAgICAgICAgICAgICAgdmFsdWU9e3NlYXJjaFF1ZXJ5fVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0U2VhcmNoUXVlcnkoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1bIzE4MUQyOF0gYm9yZGVyIGJvcmRlci1ncmF5LTgwMCByb3VuZGVkLXhsIHB4LTMuNSBweS0yLjUgdGV4dC14cyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLWdyYXktNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItaW5kaWdvLTUwMFwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHB4LTQgcGItNCBzcGFjZS15LTRcIj5cbiAgICAgICAgICAgICAge3NlYXJjaFF1ZXJ5LnRyaW0oKS5sZW5ndGggPD0gMSA/IChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNTAwIHRleHQtY2VudGVyIHB5LTggaXRhbGljXCI+VHlwZSBhdCBsZWFzdCAyIGNoYXJhY3RlcnMgdG8gdHJpZ2dlciBzY2FuLi4uPC9wPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICB7LyogVXNlcnMgc2VhcmNoIHJlc3VsdHMgKi99XG4gICAgICAgICAgICAgICAgICB7c2VhcmNoUmVzdWx0cy51c2Vycy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIGZvbnQtYm9sZCB0ZXh0LWdyYXktNDAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgYmxvY2tcIj5NYXRjaGVkIFRyYWRlcnM8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0xIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7c2VhcmNoUmVzdWx0cy51c2Vycy5tYXAoKHU6IGFueSkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17dS5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHZpZXdVc2VyUHJvZmlsZSh1LmlkKTsgc2V0R2xvYmFsU2VhcmNoT3BlbihmYWxzZSk7IHNldFNlYXJjaFF1ZXJ5KCcnKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTIuNSBiZy1bIzE4MUQyOF0gYm9yZGVyIGJvcmRlci1ncmF5LTgwMCByb3VuZGVkLXhsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yLjUgY3Vyc29yLXBvaW50ZXIgaG92ZXI6Ym9yZGVyLWdyYXktNzAwIHRyYW5zaXRpb25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTggaC04IHJvdW5kZWQtZnVsbCBiZy1pbmRpZ28tNjAwIHRleHQtd2hpdGUgZm9udC1ib2xkIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt1LmF2YXRhcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC13aGl0ZSBibG9jayBsZWFkaW5nLXRpZ2h0XCI+e3UuZmlyc3ROYW1lfSB7dS5sYXN0TmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtZ3JheS01MDBcIj5Ae3UudXNlcm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBQb3N0cyBzZWFyY2ggcmVzdWx0cyAqL31cbiAgICAgICAgICAgICAgICAgIHtzZWFyY2hSZXN1bHRzLnBvc3RzLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gZm9udC1ib2xkIHRleHQtZ3JheS00MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCBibG9ja1wiPk1hdGNoZWQgVHJhZGluZyBQb3N0czwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3NlYXJjaFJlc3VsdHMucG9zdHMubWFwKChwOiBhbnkpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e3AuaWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geyBzZXRBY3RpdmVWaWV3KCdmZWVkJyk7IHNldEdsb2JhbFNlYXJjaE9wZW4oZmFsc2UpOyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMyBiZy1bIzE4MUQyOF0gYm9yZGVyIGJvcmRlci1ncmF5LTgwMCByb3VuZGVkLXhsIGN1cnNvci1wb2ludGVyIGhvdmVyOmJvcmRlci1ncmF5LTcwMCB0cmFuc2l0aW9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBtYi0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC13aGl0ZVwiPntwLmF1dGhvck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOHB4XSB0ZXh0LWdyYXktNTAwXCI+QHtwLmF1dGhvclVzZXJuYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktMzAwIGxpbmUtY2xhbXAtMiBsZWFkaW5nLXJlbGF4ZWRcIj57cC5jb250ZW50fTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICB7c2VhcmNoUmVzdWx0cy51c2Vycy5sZW5ndGggPT09IDAgJiYgc2VhcmNoUmVzdWx0cy5wb3N0cy5sZW5ndGggPT09IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNTAwIHRleHQtY2VudGVyIHB5LThcIj5ObyByZXN1bHRzIGZvdW5kIGZvciBcIntzZWFyY2hRdWVyeX1cIjwvcD5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBNQUlOIFNDUkVFTiBQQU5FTFMgKi99XG4gICAgICBcbiAgICAgIHsvKiBXRUIgREVTS1RPUCBMQVlPVVQgV1JBUFBFUiAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPXtgZmxleC0xIHctZnVsbCBtYXgtdy1bMTEyOHB4XSBteC1hdXRvIGZsZXggbGc6anVzdGlmeS1jZW50ZXIgbGc6Z2FwLTYgbWQ6Z2FwLTQgb3ZlcmZsb3ctaGlkZGVuICR7YWN0aXZlVmlldyAhPT0gJ21lc3NhZ2VzJyA/ICdsZzpwdC02IG1kOnB0LTQgbGc6cHgtNiBtZDpweC00JyA6ICcnfWB9PlxuICAgICAgICBcbiAgICAgICAgey8qIExFRlQgU0lERUJBUiAoV2ViIERlc2t0b3AgT25seSkgKi99XG4gICAgICAgIHthY3RpdmVWaWV3ICE9PSAnbWVzc2FnZXMnICYmIChcbiAgICAgICAgICA8YXNpZGUgY2xhc3NOYW1lPVwiaGlkZGVuIG1kOmZsZXggZmxleC1jb2wgdy1bMjI1cHhdIHNocmluay0wIGdhcC00IG92ZXJmbG93LXktYXV0byBuby1zY3JvbGxiYXIgcGItMTBcIj5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgey8qIFByb2ZpbGUgU3VtbWFyeSBDYXJkICovfVxuICAgICAgICAgICAgPG1vdGlvbi5kaXYgXG4gICAgICAgICAgICAgIGluaXRpYWw9e3sgb3BhY2l0eTogMCwgeTogMjAgfX1cbiAgICAgICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB5OiAwIH19XG4gICAgICAgICAgICAgIHRyYW5zaXRpb249e3sgZHVyYXRpb246IDAuNCwgdHlwZTogXCJzcHJpbmdcIiwgc3RpZmZuZXNzOiAyMDAsIGRhbXBpbmc6IDIwIH19XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLXdoaXRlIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgb3ZlcmZsb3ctaGlkZGVuIHNoYWRvdy1zbVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC0xNiBiZy1ncmFkaWVudC10by1yIGZyb20taW5kaWdvLTUwMCB0by1wdXJwbGUtNjAwXCI+PC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtNCBwYi00IHJlbGF0aXZlIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyIGJvcmRlci1iIGJvcmRlci1zbGF0ZS0xMDBcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTYgaC0xNiByb3VuZGVkLWZ1bGwgYmctaW5kaWdvLTYwMCB0ZXh0LXdoaXRlIGZvbnQtYmxhY2sgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC0yeGwgc2hhZG93LW1kIGJvcmRlci00IGJvcmRlci13aGl0ZSAtbXQtOCBtYi0yIGN1cnNvci1wb2ludGVyIG92ZXJmbG93LWhpZGRlblwiIG9uQ2xpY2s9eygpID0+IHNldEFjdGl2ZVZpZXcoJ3Byb2ZpbGUnKX0+XG4gICAgICAgICAgICAgICAgICB7Y3VycmVudFVzZXI/LmF2YXRhciAmJiBjdXJyZW50VXNlci5hdmF0YXIubGVuZ3RoID4gMiA/IChcbiAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e2N1cnJlbnRVc2VyLmF2YXRhcn0gY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBvYmplY3QtY292ZXJcIiBhbHQ9XCJBdmF0YXJcIiByZWZlcnJlclBvbGljeT1cIm5vLXJlZmVycmVyXCIgLz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRVc2VyPy5hdmF0YXIgfHwgXCLwn5GkXCJcbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTkwMCBsZWFkaW5nLXRpZ2h0IGhvdmVyOnVuZGVybGluZSBjdXJzb3ItcG9pbnRlclwiIG9uQ2xpY2s9eygpID0+IHNldEFjdGl2ZVZpZXcoJ3Byb2ZpbGUnKX0+e2N1cnJlbnRVc2VyLmZpcnN0TmFtZX0ge2N1cnJlbnRVc2VyLmxhc3ROYW1lfTwvaDM+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgbWItMVwiPkB7Y3VycmVudFVzZXIudXNlcm5hbWV9PC9wPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNjAwIGxpbmUtY2xhbXAtMVwiPntjdXJyZW50VXNlci5iaW8gfHwgXCJUcmFkaW5nIGVudGh1c2lhc3QgJiBjb21tdW5pdHkgbWVtYmVyXCJ9PC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweS0zIHB4LTMgZmxleCBmbGV4LWNvbCBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdyb3VwIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlVmlldygnbmV0d29yaycpfT5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtbWVkaXVtIHRleHQtc2xhdGUtNTAwIGdyb3VwLWhvdmVyOnVuZGVybGluZVwiPlByb2ZpbGUgdmlld2Vyczwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LWluZGlnby02MDBcIj4xMjQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ3JvdXAgY3Vyc29yLXBvaW50ZXJcIiBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVWaWV3KCdmZWVkJyl9PlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1tZWRpdW0gdGV4dC1zbGF0ZS01MDAgZ3JvdXAtaG92ZXI6dW5kZXJsaW5lXCI+UG9zdCBpbXByZXNzaW9uczwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LWluZGlnby02MDBcIj44NDI8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMyBib3JkZXItdCBib3JkZXItc2xhdGUtMTAwIGhvdmVyOmJnLXNsYXRlLTUwIGN1cnNvci1wb2ludGVyIHRyYW5zaXRpb25cIiBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVWaWV3KCdwcm9maWxlJyl9PlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTkwMFwiPlByZW1pdW0gRmVhdHVyZXM8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LXNsYXRlLTUwMFwiPkFjY2VzcyBleGNsdXNpdmUgdHJhZGluZyBpbnNpZ2h0czwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L21vdGlvbi5kaXY+XG5cbiAgICAgICAgICAgIHsvKiBNYWluIE5hdmlnYXRpb24gTWVudSAqL31cbiAgICAgICAgICAgIDxtb3Rpb24uZGl2IFxuICAgICAgICAgICAgICBpbml0aWFsPVwiaGlkZGVuXCJcbiAgICAgICAgICAgICAgYW5pbWF0ZT1cInZpc2libGVcIlxuICAgICAgICAgICAgICB2YXJpYW50cz17e1xuICAgICAgICAgICAgICAgIGhpZGRlbjogeyBvcGFjaXR5OiAwIH0sXG4gICAgICAgICAgICAgICAgdmlzaWJsZToge1xuICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246IHsgc3RhZ2dlckNoaWxkcmVuOiAwLjA4LCBkZWxheUNoaWxkcmVuOiAwLjE1IH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLXdoaXRlIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgcC0zIHNoYWRvdy1zbSBmbGV4IGZsZXgtY29sIGdhcC0xLjVcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8bW90aW9uLmJ1dHRvbiBcbiAgICAgICAgICAgICAgICB2YXJpYW50cz17eyBoaWRkZW46IHsgb3BhY2l0eTogMCwgeDogLTIwIH0sIHZpc2libGU6IHsgb3BhY2l0eTogMSwgeDogMCwgdHJhbnNpdGlvbjogeyB0eXBlOiBcInNwcmluZ1wiLCBzdGlmZm5lc3M6IDMwMCwgZGFtcGluZzogMjQgfSB9IH19XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlVmlldygnZmVlZCcpfSBcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyBweC0zIHB5LTIuNSByb3VuZGVkLXhsIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTIwMCBncm91cCBhY3RpdmU6c2NhbGUtOTUgJHthY3RpdmVWaWV3ID09PSAnZmVlZCcgPyAnYmctaW5kaWdvLTUwIHRleHQtaW5kaWdvLTYwMCBmb250LWJvbGQgc2hhZG93LXNtIHJpbmctMSByaW5nLWluZGlnby01MDAvMTAnIDogJ3RleHQtc2xhdGUtNjAwIGhvdmVyOmJnLXNsYXRlLTUwIGhvdmVyOnRleHQtc2xhdGUtOTAwIGhvdmVyOnRyYW5zbGF0ZS14LTEnfWB9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8TGF5b3V0RGFzaGJvYXJkIHNpemU9ezE4fSBjbGFzc05hbWU9e2B0cmFuc2l0aW9uLXRyYW5zZm9ybSBkdXJhdGlvbi0yMDAgJHthY3RpdmVWaWV3ID09PSAnZmVlZCcgPyAnc2NhbGUtMTEwJyA6ICdncm91cC1ob3ZlcjpzY2FsZS0xMTAgZ3JvdXAtaG92ZXI6dGV4dC1pbmRpZ28tNTAwJ31gfSAvPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc21cIj5EYXNoYm9hcmQ8L3NwYW4+XG4gICAgICAgICAgICAgIDwvbW90aW9uLmJ1dHRvbj5cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIDxtb3Rpb24uZGl2IFxuICAgICAgICAgICAgICAgIHZhcmlhbnRzPXt7IGhpZGRlbjogeyBvcGFjaXR5OiAwLCB4OiAtMjAgfSwgdmlzaWJsZTogeyBvcGFjaXR5OiAxLCB4OiAwLCB0cmFuc2l0aW9uOiB7IHR5cGU6IFwic3ByaW5nXCIsIHN0aWZmbmVzczogMzAwLCBkYW1waW5nOiAyNCB9IH0gfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17KCkgPT4gc2V0QWN0aXZlVmlldygnam91cm5hbCcpfSBjbGFzc05hbWU9e2BmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyBweC0zIHB5LTIuNSByb3VuZGVkLXhsIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTIwMCBncm91cCBhY3RpdmU6c2NhbGUtOTUgcmVsYXRpdmUgJHthY3RpdmVWaWV3ID09PSAnam91cm5hbCcgPyAnYmctaW5kaWdvLTUwIHRleHQtaW5kaWdvLTYwMCBmb250LWJvbGQgc2hhZG93LXNtIHJpbmctMSByaW5nLWluZGlnby01MDAvMTAnIDogJ3RleHQtc2xhdGUtNjAwIGhvdmVyOmJnLXNsYXRlLTUwIGhvdmVyOnRleHQtc2xhdGUtOTAwIGhvdmVyOnRyYW5zbGF0ZS14LTEnfWB9PlxuICAgICAgICAgICAgICAgICAgPEJvb2tPcGVuIHNpemU9ezE4fSBjbGFzc05hbWU9e2B0cmFuc2l0aW9uLXRyYW5zZm9ybSBkdXJhdGlvbi0yMDAgJHthY3RpdmVWaWV3ID09PSAnam91cm5hbCcgPyAnc2NhbGUtMTEwJyA6ICdncm91cC1ob3ZlcjpzY2FsZS0xMTAgZ3JvdXAtaG92ZXI6dGV4dC1pbmRpZ28tNTAwJ31gfSAvPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbVwiPkpvdXJuYWw8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIHJpZ2h0LTMgYmctcm9zZS01MDAgdGV4dC13aGl0ZSByb3VuZGVkLWZ1bGwgcC1bMnB4XSBzaGFkb3ctc20gdHJhbnNpdGlvbi10cmFuc2Zvcm0gZHVyYXRpb24tMjAwIGdyb3VwLWhvdmVyOnNjYWxlLTExMFwiPjxMb2NrIHNpemU9ezEwfSAvPjwvZGl2PlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGwtMTAgcHItMyBweS0xIGZsZXggZmxleC1jb2wgZ2FwLTAuNVwiPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVWaWV3KCdqb3VybmFsJyl9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHRleHQtbGVmdCBweS0xLjUgcHgtMiByb3VuZGVkLWxnIHRleHQteHMgdGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC1pbmRpZ28tNjAwIGhvdmVyOmJnLWluZGlnby01MCBob3Zlcjp0cmFuc2xhdGUteC0xIGZvbnQtbWVkaXVtIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTIwMCBhY3RpdmU6c2NhbGUtOTVcIj5cbiAgICAgICAgICAgICAgICAgICAgTWlzc2lvbiBHb2FsXG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17KCkgPT4gc2V0QWN0aXZlVmlldygnam91cm5hbCcpfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciB0ZXh0LWxlZnQgcHktMS41IHB4LTIgcm91bmRlZC1sZyB0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIGhvdmVyOnRleHQtaW5kaWdvLTYwMCBob3ZlcjpiZy1pbmRpZ28tNTAgaG92ZXI6dHJhbnNsYXRlLXgtMSBmb250LW1lZGl1bSB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0yMDAgYWN0aXZlOnNjYWxlLTk1XCI+XG4gICAgICAgICAgICAgICAgICAgIFRyYWRpbmcgSm91cm5hbFxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvbW90aW9uLmRpdj5cblxuICAgICAgICAgICAgICA8bW90aW9uLmJ1dHRvbiBcbiAgICAgICAgICAgICAgICB2YXJpYW50cz17eyBoaWRkZW46IHsgb3BhY2l0eTogMCwgeDogLTIwIH0sIHZpc2libGU6IHsgb3BhY2l0eTogMSwgeDogMCwgdHJhbnNpdGlvbjogeyB0eXBlOiBcInNwcmluZ1wiLCBzdGlmZm5lc3M6IDMwMCwgZGFtcGluZzogMjQgfSB9IH19XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlVmlldygnZ3JvdXBzJyl9IFxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXggaXRlbXMtY2VudGVyIGdhcC0zIHB4LTMgcHktMi41IHJvdW5kZWQteGwgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMjAwIGdyb3VwIGFjdGl2ZTpzY2FsZS05NSAke2FjdGl2ZVZpZXcgPT09ICdncm91cHMnID8gJ2JnLWluZGlnby01MCB0ZXh0LWluZGlnby02MDAgZm9udC1ib2xkIHNoYWRvdy1zbSByaW5nLTEgcmluZy1pbmRpZ28tNTAwLzEwJyA6ICd0ZXh0LXNsYXRlLTYwMCBob3ZlcjpiZy1zbGF0ZS01MCBob3Zlcjp0ZXh0LXNsYXRlLTkwMCBob3Zlcjp0cmFuc2xhdGUteC0xJ31gfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPE1hcFBpbiBzaXplPXsxOH0gY2xhc3NOYW1lPXtgdHJhbnNpdGlvbi10cmFuc2Zvcm0gZHVyYXRpb24tMjAwICR7YWN0aXZlVmlldyA9PT0gJ2dyb3VwcycgPyAnc2NhbGUtMTEwIHRleHQtaW5kaWdvLTYwMCcgOiAnZ3JvdXAtaG92ZXI6c2NhbGUtMTEwIGdyb3VwLWhvdmVyOnRleHQtaW5kaWdvLTUwMCd9YH0gLz5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtXCI+Q29tbXVuaXR5PC9zcGFuPlxuICAgICAgICAgICAgICA8L21vdGlvbi5idXR0b24+XG5cbiAgICAgICAgICAgICAgPG1vdGlvbi5idXR0b24gXG4gICAgICAgICAgICAgICAgdmFyaWFudHM9e3sgaGlkZGVuOiB7IG9wYWNpdHk6IDAsIHg6IC0yMCB9LCB2aXNpYmxlOiB7IG9wYWNpdHk6IDEsIHg6IDAsIHRyYW5zaXRpb246IHsgdHlwZTogXCJzcHJpbmdcIiwgc3RpZmZuZXNzOiAzMDAsIGRhbXBpbmc6IDI0IH0gfSB9fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEFjdGl2ZVZpZXcoJ2FjY291bnQnKX0gXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgcHgtMyBweS0yLjUgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0yMDAgZ3JvdXAgYWN0aXZlOnNjYWxlLTk1ICR7YWN0aXZlVmlldyA9PT0gJ2FjY291bnQnID8gJ2JnLWluZGlnby01MCB0ZXh0LWluZGlnby02MDAgZm9udC1ib2xkIHNoYWRvdy1zbSByaW5nLTEgcmluZy1pbmRpZ28tNTAwLzEwJyA6ICd0ZXh0LXNsYXRlLTYwMCBob3ZlcjpiZy1zbGF0ZS01MCBob3Zlcjp0ZXh0LXNsYXRlLTkwMCBob3Zlcjp0cmFuc2xhdGUteC0xJ31gfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPFNoaWVsZENoZWNrIHNpemU9ezE4fSBjbGFzc05hbWU9e2B0cmFuc2l0aW9uLXRyYW5zZm9ybSBkdXJhdGlvbi0yMDAgJHthY3RpdmVWaWV3ID09PSAnYWNjb3VudCcgPyAnc2NhbGUtMTEwJyA6ICdncm91cC1ob3ZlcjpzY2FsZS0xMTAgZ3JvdXAtaG92ZXI6dGV4dC1pbmRpZ28tNTAwJ31gfSAvPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc21cIj5BY2NvdW50PC9zcGFuPlxuICAgICAgICAgICAgICA8L21vdGlvbi5idXR0b24+XG5cbiAgICAgICAgICAgICAgPG1vdGlvbi5kaXYgXG4gICAgICAgICAgICAgICAgdmFyaWFudHM9e3sgaGlkZGVuOiB7IG9wYWNpdHk6IDAsIHg6IC0yMCB9LCB2aXNpYmxlOiB7IG9wYWNpdHk6IDEsIHg6IDAsIHRyYW5zaXRpb246IHsgdHlwZTogXCJzcHJpbmdcIiwgc3RpZmZuZXNzOiAzMDAsIGRhbXBpbmc6IDI0IH0gfSB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2xcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVWaWV3KCdvdXRsb29rJyl9IGNsYXNzTmFtZT17YGZsZXggaXRlbXMtY2VudGVyIGdhcC0zIHB4LTMgcHktMi41IHJvdW5kZWQteGwgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMjAwIGdyb3VwIGFjdGl2ZTpzY2FsZS05NSByZWxhdGl2ZSAke2FjdGl2ZVZpZXcgPT09ICdvdXRsb29rJyA/ICdiZy1pbmRpZ28tNTAgdGV4dC1pbmRpZ28tNjAwIGZvbnQtYm9sZCBzaGFkb3ctc20gcmluZy0xIHJpbmctaW5kaWdvLTUwMC8xMCcgOiAndGV4dC1zbGF0ZS02MDAgaG92ZXI6Ymctc2xhdGUtNTAgaG92ZXI6dGV4dC1zbGF0ZS05MDAgaG92ZXI6dHJhbnNsYXRlLXgtMSd9YH0+XG4gICAgICAgICAgICAgICAgICA8R2xvYmUgc2l6ZT17MTh9IGNsYXNzTmFtZT17YHRyYW5zaXRpb24tdHJhbnNmb3JtIGR1cmF0aW9uLTIwMCAke2FjdGl2ZVZpZXcgPT09ICdvdXRsb29rJyA/ICdzY2FsZS0xMTAnIDogJ2dyb3VwLWhvdmVyOnNjYWxlLTExMCBncm91cC1ob3Zlcjp0ZXh0LWluZGlnby01MDAnfWB9IC8+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtXCI+T3V0bG9vazwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBsLTEwIHByLTMgcHktMSBmbGV4IGZsZXgtY29sIGdhcC0wLjVcIj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17KCkgPT4gc2V0QWN0aXZlVmlldygnb3V0bG9vaycpfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciB0ZXh0LWxlZnQgcHktMS41IHB4LTIgcm91bmRlZC1sZyB0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIGhvdmVyOnRleHQtaW5kaWdvLTYwMCBob3ZlcjpiZy1pbmRpZ28tNTAgaG92ZXI6dHJhbnNsYXRlLXgtMSBmb250LW1lZGl1bSB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0yMDAgYWN0aXZlOnNjYWxlLTk1XCI+XG4gICAgICAgICAgICAgICAgICAgIE5ld3MgYW5kIENhbGVuZGFyXG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17KCkgPT4gc2V0QWN0aXZlVmlldygnb3V0bG9vaycpfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciB0ZXh0LWxlZnQgcHktMS41IHB4LTIgcm91bmRlZC1sZyB0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIGhvdmVyOnRleHQtaW5kaWdvLTYwMCBob3ZlcjpiZy1pbmRpZ28tNTAgaG92ZXI6dHJhbnNsYXRlLXgtMSBmb250LW1lZGl1bSB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0yMDAgYWN0aXZlOnNjYWxlLTk1XCI+XG4gICAgICAgICAgICAgICAgICAgIFRlY2huaWNhbCBBbmFseXNpc1xuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvbW90aW9uLmRpdj5cblxuICAgICAgICAgICAgICA8bW90aW9uLmRpdiB2YXJpYW50cz17eyBoaWRkZW46IHsgb3BhY2l0eTogMCwgeDogLTIwIH0sIHZpc2libGU6IHsgb3BhY2l0eTogMSwgeDogMCwgdHJhbnNpdGlvbjogeyB0eXBlOiBcInNwcmluZ1wiLCBzdGlmZm5lc3M6IDMwMCwgZGFtcGluZzogMjQgfSB9IH19PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1weCBiZy1zbGF0ZS0xMDAgbXktMSBteC0yXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEFjdGl2ZVZpZXcoJ3Byb2ZpbGUnKX0gXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgcHgtMyBweS0yLjUgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0yMDAgZ3JvdXAgYWN0aXZlOnNjYWxlLTk1ICR7XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZVZpZXcgPT09ICdwcm9maWxlJyBcbiAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1pbmRpZ28tNTAgdGV4dC1pbmRpZ28tNjAwIGZvbnQtYm9sZCBzaGFkb3ctc20gcmluZy0xIHJpbmctaW5kaWdvLTUwMC8xMCcgXG4gICAgICAgICAgICAgICAgICAgICAgOiAndGV4dC1zbGF0ZS02MDAgaG92ZXI6Ymctc2xhdGUtNTAgaG92ZXI6dGV4dC1zbGF0ZS05MDAgaG92ZXI6dHJhbnNsYXRlLXgtMSdcbiAgICAgICAgICAgICAgICAgIH1gfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxVc2VySWNvbiBzaXplPXsxOH0gY2xhc3NOYW1lPXtgdHJhbnNpdGlvbi10cmFuc2Zvcm0gZHVyYXRpb24tMjAwICR7YWN0aXZlVmlldyA9PT0gJ3Byb2ZpbGUnID8gJ3NjYWxlLTExMCcgOiAnZ3JvdXAtaG92ZXI6c2NhbGUtMTEwIGdyb3VwLWhvdmVyOnRleHQtaW5kaWdvLTUwMCd9YH0gLz5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc21cIj5Qcm9maWxlPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L21vdGlvbi5kaXY+XG4gICAgICAgICAgICA8L21vdGlvbi5kaXY+XG4gICAgICAgICAgICBcbiAgICAgICAgICA8L2FzaWRlPlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBDRU5URVIgTUFJTiBDT05URU5UICovfVxuICAgICAgICA8bWFpbiByZWY9e21haW5SZWZ9IGNsYXNzTmFtZT17YGZsZXgtMSBtaW4tdy0wIHctZnVsbCBtYXgtdy1bNTU1cHhdIGgtZnVsbCBvdmVyZmxvdy15LWF1dG8gbm8tc2Nyb2xsYmFyICR7YWN0aXZlVmlldyAhPT0gJ21lc3NhZ2VzJyA/IGBsZzpiZy10cmFuc3BhcmVudCBiZy13aGl0ZSBzaGFkb3ctMnhsIGxnOnNoYWRvdy1ub25lIGJvcmRlci14IGxnOmJvcmRlci1ub25lIGJvcmRlci1zbGF0ZS0yMDAgJHthY3RpdmVWaWV3ID09PSAnZmVlZCcgPyAnJyA6ICdzcGFjZS15LTQnfWAgOiAnb3ZlcmZsb3ctaGlkZGVuIGZsZXggZmxleC1jb2wgbGc6Ymctd2hpdGUgbGc6Ym9yZGVyIGxnOmJvcmRlci1zbGF0ZS0yMDAgbGc6cm91bmRlZC0yeGwgbGc6c2hhZG93LXNtJ31gfT5cblxuICAgICAgICBcbiAgICAgICAgey8qIFZJRVcgMTogSE9NRSBGRUVEICovfVxuICAgICAgICB7YWN0aXZlVmlldyA9PT0gJ2ZlZWQnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBiLTIwIGxnOnBiLTAgYmctd2hpdGUgbGc6YmctdHJhbnNwYXJlbnQgbGc6cm91bmRlZC0yeGwgb3ZlcmZsb3ctaGlkZGVuXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXNsYXRlLTMwMCBsZzpiZy10cmFuc3BhcmVudCBmbGV4IGZsZXgtY29sXCI+XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICB7LyogQ3JlYXRlIFBvc3QgKi99XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3RpY2t5IHRvcC0wIHotMjAgcGItMiBiZy1bI2YzZjJlZl1cIj5cbiAgICAgICAgICAgICAgICA8Q3JlYXRlUG9zdCBvblBvc3RDcmVhdGVkPXtmZXRjaFBvc3RzfSAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogRmVlZCBpdGVtcyBsaXN0ICovfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMiBiZy1zbGF0ZS0zMDAgbGc6YmctdHJhbnNwYXJlbnQgZmxleCBmbGV4LWNvbFwiPlxuICAgICAgICAgICAgICAgIHtwb3N0cy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlIHAtMTIgdGV4dC1jZW50ZXIgdGV4dC1ncmF5LTUwMCB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAgICAgIEZlZWQgaXMgZW1wdHkuIEJlIHRoZSBmaXJzdCB0byBzaGFyZSB5b3VyIHRyYWRpbmcgc2V0dXBzIVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgIHBvc3RzLm1hcChwb3N0ID0+IChcbiAgICAgICAgICAgICAgICAgICAgPFBvc3RDYXJkIGtleT17cG9zdC5pZH0gcG9zdD17cG9zdH0gb25Qb3N0VXBkYXRlZD17ZmV0Y2hQb3N0c30gLz5cbiAgICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBWSUVXIDI6IE5FVFdPUksgKi99XG4gICAgICAgIHthY3RpdmVWaWV3ID09PSAnbmV0d29yaycgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC00XCI+XG4gICAgICAgICAgICA8aDEgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LWJsYWNrIHRleHQtc2xhdGUtOTUwIG1iLTRcIj5OZXR3b3JrPC9oMT5cbiAgICAgICAgICAgIDxOZXR3b3JrIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFZJRVcgMzogTEVBREVSQk9BUkQgKi99XG4gICAgICAgIHthY3RpdmVWaWV3ID09PSAnbGVhZGVyYm9hcmQnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNFwiPlxuICAgICAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ibGFjayB0ZXh0LXNsYXRlLTk1MCBtYi00XCI+TGVhZGVyYm9hcmQ8L2gxPlxuICAgICAgICAgICAgPExlYWRlcmJvYXJkIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFZJRVcgNDogQ09NTVVOSVRZIChHUk9VUFMpICovfVxuICAgICAgICB7YWN0aXZlVmlldyA9PT0gJ2V4cGxvcmUnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNFwiPlxuICAgICAgICAgICAgPEdyb3VwVmlldyBvbkJhY2s9eygpID0+IHNldEFjdGl2ZVZpZXcoJ2ZlZWQnKX0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVklFVyA1OiBNRVNTQUdFUyAqL31cbiAgICAgICAge2FjdGl2ZVZpZXcgPT09ICdtZXNzYWdlcycgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBoLWZ1bGxcIj5cbiAgICAgICAgICAgIDxoMSBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS05NTAgcC00IGJvcmRlci1iXCI+TWVzc2FnZXM8L2gxPlxuICAgICAgICAgICAgPE1lc3NhZ2VzIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFZJRVcgNjogTk9USUZJQ0FUSU9OUyAqL31cbiAgICAgICAge2FjdGl2ZVZpZXcgPT09ICdub3RpZmljYXRpb25zJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTRcIj5cbiAgICAgICAgICAgIDxoMSBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS05NTAgbWItNFwiPk5vdGlmaWNhdGlvbnM8L2gxPlxuICAgICAgICAgICAgPE5vdGlmaWNhdGlvbnMgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVklFVyA3OiBQUk9GSUxFICovfVxuICAgICAgICB7YWN0aXZlVmlldyA9PT0gJ3Byb2ZpbGUnICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNFwiPlxuICAgICAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ibGFjayB0ZXh0LXNsYXRlLTk1MCBtYi00XCI+UHJvZmlsZTwvaDE+XG4gICAgICAgICAgICA8UHJvZmlsZSAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBWSUVXIDg6IEpPVVJOQUwgKi99XG4gICAgICAgIHthY3RpdmVWaWV3ID09PSAnam91cm5hbCcgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC00XCI+XG4gICAgICAgICAgICA8aDEgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LWJsYWNrIHRleHQtc2xhdGUtOTUwIG1iLTRcIj5Kb3VybmFsPC9oMT5cbiAgICAgICAgICAgIDxKb3VybmFsIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFZJRVcgOTogQUNDT1VOVCAqL31cbiAgICAgICAge2FjdGl2ZVZpZXcgPT09ICdhY2NvdW50JyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTRcIj5cbiAgICAgICAgICAgIDxoMSBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS05NTAgbWItNFwiPkFjY291bnQ8L2gxPlxuICAgICAgICAgICAgPEFjY291bnQgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVklFVyAxMDogT1VUTE9PSyAqL31cbiAgICAgICAge2FjdGl2ZVZpZXcgPT09ICdvdXRsb29rJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTRcIj5cbiAgICAgICAgICAgIDxoMSBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS05NTAgbWItNFwiPk1hcmtldCBPdXRsb29rPC9oMT5cbiAgICAgICAgICAgIDxNZW1vaXplZE91dGxvb2sgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogVklFVyAxMTogVVNFUiBQUk9GSUxFICovfVxuICAgICAgICB7YWN0aXZlVmlldyA9PT0gJ3VzZXItcHJvZmlsZScgJiYgc2VsZWN0ZWRVc2VySWQgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC00XCI+XG4gICAgICAgICAgICA8aDEgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LWJsYWNrIHRleHQtc2xhdGUtOTUwIG1iLTRcIj5Vc2VyIFByb2ZpbGU8L2gxPlxuICAgICAgICAgICAgPFVzZXJQcm9maWxlIHVzZXJJZD17c2VsZWN0ZWRVc2VySWR9IG9uQmFjaz17KCkgPT4gc2V0QWN0aXZlVmlldygnZmVlZCcpfSAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBWSUVXIDEyOiBBRE1JTiBQT1JUQUwgKi99XG4gICAgICAgIHthY3RpdmVWaWV3ID09PSAnYWRtaW4nICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNFwiPlxuICAgICAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ibGFjayB0ZXh0LXNsYXRlLTk1MCBtYi00XCI+QWRtaW4gUG9ydGFsPC9oMT5cbiAgICAgICAgICAgIDxBZG1pblBvcnRhbCAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIHsvKiBWSUVXIDEzOiBHUk9VUFMgKi99XG4gICAgICAgIHthY3RpdmVWaWV3ID09PSAnZ3JvdXBzJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTRcIj5cbiAgICAgICAgICAgIDxHcm91cFZpZXcgb25CYWNrPXsoKSA9PiBzZXRBY3RpdmVWaWV3KCdmZWVkJyl9IC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgIFxuICAgICAgICA8L21haW4+XG5cbiAgICAgICAgey8qIFJJR0hUIFNJREVCQVIgKFdlYiBEZXNrdG9wIE9ubHkpICovfVxuICAgICAgICB7YWN0aXZlVmlldyAhPT0gJ21lc3NhZ2VzJyAmJiAoXG4gICAgICAgICAgPGFzaWRlIGNsYXNzTmFtZT1cImhpZGRlbiBsZzpmbGV4IGZsZXgtY29sIHctWzMxNXB4XSBzaHJpbmstMCBnYXAtNCBvdmVyZmxvdy15LWF1dG8gbm8tc2Nyb2xsYmFyIHBiLTEwXCI+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHsvKiBCcm9rZXIgUGFydG5lcnMgV2lkZ2V0ICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZSByb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBwLTQgc2hhZG93LXNtXCI+XG4gICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS05MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCBtYi0zIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPEhhbmRzaGFrZSBzaXplPXsxNH0gY2xhc3NOYW1lPVwidGV4dC1pbmRpZ28tNTAwXCIgLz5cbiAgICAgICAgICAgICAgICBCcm9rZXIgUGFydG5lcnNcbiAgICAgICAgICAgICAgPC9oND5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTNcIj5cbiAgICAgICAgICAgICAgICB7W1xuICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnR290cmFkZScsIHR5cGU6ICdVUyBTdG9ja3MnLCBzdGF0dXM6ICdDb25uZWN0ZWQnIH0sXG4gICAgICAgICAgICAgICAgICB7IG5hbWU6ICdBamFpYicsIHR5cGU6ICdDcnlwdG8gJiBTdG9ja3MnLCBzdGF0dXM6ICdDb25uZWN0JyB9XG4gICAgICAgICAgICAgICAgXS5tYXAoKGJyb2tlciwgaWR4KSA9PiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGtleT17aWR4fSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW5cIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTggaC04IHJvdW5kZWQtbGcgYmctc2xhdGUtMTAwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTUwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge2Jyb2tlci5uYW1lWzBdfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTkwMFwiPnticm9rZXIubmFtZX08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMFwiPnticm9rZXIudHlwZX08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT17YHRleHQtWzlweF0gZm9udC1ib2xkIHB4LTIgcHktMSByb3VuZGVkLW1kIHRyYW5zaXRpb24gJHticm9rZXIuc3RhdHVzID09PSAnQ29ubmVjdGVkJyA/ICdiZy1lbWVyYWxkLTUwIHRleHQtZW1lcmFsZC02MDAnIDogJ2JnLXNsYXRlLTEwMCBob3ZlcjpiZy1zbGF0ZS0yMDAgdGV4dC1zbGF0ZS03MDAnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgIHticm9rZXIuc3RhdHVzfVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogVXBjb21pbmcgRXZlbnRzIFdpZGdldCAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgcm91bmRlZC0yeGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgcC00IHNoYWRvdy1zbVwiPlxuICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJsYWNrIHRleHQtc2xhdGUtOTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgbWItMyBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxDYWxlbmRhciBzaXplPXsxNH0gY2xhc3NOYW1lPVwidGV4dC1pbmRpZ28tNTAwXCIgLz5cbiAgICAgICAgICAgICAgICBVcGNvbWluZyBFdmVudHNcbiAgICAgICAgICAgICAgPC9oND5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTNcIj5cbiAgICAgICAgICAgICAgICB7W1xuICAgICAgICAgICAgICAgICAgeyB0aXRsZTogJ05GUCBEYXRhIFJlbGVhc2UnLCBkYXRlOiAnVG9tb3Jyb3csIDA4OjMwIEVTVCcsIGltcGFjdDogJ0hpZ2gnIH0sXG4gICAgICAgICAgICAgICAgICB7IHRpdGxlOiAnRk9NQyBNZWV0aW5nJywgZGF0ZTogJ1dlZCwgMTQ6MDAgRVNUJywgaW1wYWN0OiAnSGlnaCcgfVxuICAgICAgICAgICAgICAgIF0ubWFwKChldmVudCwgaWR4KSA9PiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGtleT17aWR4fSBjbGFzc05hbWU9XCJib3JkZXItbC0yIGJvcmRlci1pbmRpZ28tNTAwIHBsLTNcIj5cbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDBcIj57ZXZlbnQudGl0bGV9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTUwMCBtdC0wLjVcIj57ZXZlbnQuZGF0ZX08L3A+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIE1hcmtldCBOZXdzIFdpZGdldCAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgcm91bmRlZC0yeGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgcC00IHNoYWRvdy1zbVwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIG1iLTMgcmVsYXRpdmVcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlTmV3c1RhYignbmV3cycpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcmVsYXRpdmUgdGV4dC14cyBmb250LWJsYWNrIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSB0cmFuc2l0aW9uIHB4LTIgcHktMSB6LTEwICR7YWN0aXZlTmV3c1RhYiA9PT0gJ25ld3MnID8gJ3RleHQtc2xhdGUtOTAwJyA6ICd0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXNsYXRlLTYwMCd9YH1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICA8TmV3c3BhcGVyIHNpemU9ezE0fSBjbGFzc05hbWU9e2B0cmFuc2l0aW9uLWNvbG9ycyAke2FjdGl2ZU5ld3NUYWIgPT09ICduZXdzJyA/ICd0ZXh0LWluZGlnby01MDAnIDogJyd9YH0gLz5cbiAgICAgICAgICAgICAgICAgIE5ld3NcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlTmV3c1RhYignY2FsZW5kYXInKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHJlbGF0aXZlIHRleHQteHMgZm9udC1ibGFjayB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgdHJhbnNpdGlvbiBweC0yIHB5LTEgei0xMCAke2FjdGl2ZU5ld3NUYWIgPT09ICdjYWxlbmRhcicgPyAndGV4dC1zbGF0ZS05MDAnIDogJ3RleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtc2xhdGUtNjAwJ31gfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxDYWxlbmRhciBzaXplPXsxNH0gY2xhc3NOYW1lPXtgdHJhbnNpdGlvbi1jb2xvcnMgJHthY3RpdmVOZXdzVGFiID09PSAnY2FsZW5kYXInID8gJ3RleHQtaW5kaWdvLTUwMCcgOiAnJ31gfSAvPlxuICAgICAgICAgICAgICAgICAgRXZlbnRzXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgey8qIEFjdGl2ZSBUYWIgSW5kaWNhdG9yICovfVxuICAgICAgICAgICAgICAgIDxtb3Rpb24uZGl2XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhYnNvbHV0ZSB0b3AtMCBib3R0b20tMCBiZy1zbGF0ZS0xMDAgcm91bmRlZC1sZyB6LTBcIlxuICAgICAgICAgICAgICAgICAgaW5pdGlhbD17ZmFsc2V9XG4gICAgICAgICAgICAgICAgICBhbmltYXRlPXt7XG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IGFjdGl2ZU5ld3NUYWIgPT09ICduZXdzJyA/ICcwJScgOiAnNTAlJyxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IGFjdGl2ZU5ld3NUYWIgPT09ICduZXdzJyA/ICc4MnB4JyA6ICc5MnB4JywgXG4gICAgICAgICAgICAgICAgICAgIHg6IGFjdGl2ZU5ld3NUYWIgPT09ICduZXdzJyA/IDAgOiA4IC8vIEFkanVzdCBmb3Igc3BhY2luZ1xuICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb249e3sgdHlwZTogXCJzcHJpbmdcIiwgc3RpZmZuZXNzOiAzMDAsIGRhbXBpbmc6IDMwIH19XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBvdmVyZmxvdy1oaWRkZW5cIj5cbiAgICAgICAgICAgICAgICA8QW5pbWF0ZVByZXNlbmNlIG1vZGU9XCJ3YWl0XCI+XG4gICAgICAgICAgICAgICAgICB7YWN0aXZlTmV3c1RhYiA9PT0gJ25ld3MnID8gKFxuICAgICAgICAgICAgICAgICAgICA8bW90aW9uLmRpdiBcbiAgICAgICAgICAgICAgICAgICAgICBrZXk9XCJuZXdzXCJcbiAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHg6IC0yMCB9fVxuICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeDogMCB9fVxuICAgICAgICAgICAgICAgICAgICAgIGV4aXQ9e3sgb3BhY2l0eTogMCwgeDogMjAgfX1cbiAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uPXt7IGR1cmF0aW9uOiAwLjIgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJzcGFjZS15LTNcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAge21hcmtldE5ld3MubGVuZ3RoID4gMCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtldE5ld3MubWFwKChuZXdzKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGtleT17bmV3cy5pZH0gaHJlZj17bmV3cy51cmx9IGNsYXNzTmFtZT1cImJsb2NrIGdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDAgZ3JvdXAtaG92ZXI6dGV4dC1pbmRpZ28tNjAwIHRyYW5zaXRpb24gbGluZS1jbGFtcC0yXCI+e25ld3MudGl0bGV9PC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIG10LTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWluZGlnby01MDAgZm9udC1tZWRpdW1cIj57bmV3cy5zb3VyY2V9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMFwiPntuZXdzLnRpbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7bmV3cy5zZW50aW1lbnQgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YGZsZXggaXRlbXMtY2VudGVyIGdhcC0wLjUgdGV4dC1bMTBweF0gZm9udC1ib2xkICR7bmV3cy5zZW50aW1lbnQudHlwZSA9PT0gJ2J1bGxpc2gnID8gJ3RleHQtZW1lcmFsZC01MDAnIDogJ3RleHQtcm9zZS01MDAnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtuZXdzLnNlbnRpbWVudC50eXBlID09PSAnYnVsbGlzaCcgPyA8VHJlbmRpbmdVcCBzaXplPXsxMn0gLz4gOiA8VHJlbmRpbmdEb3duIHNpemU9ezEyfSAvPn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7bmV3cy5zZW50aW1lbnQudmFsdWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTMgYW5pbWF0ZS1wdWxzZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7WzEsIDIsIDNdLm1hcChpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17aX0gY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoLTQgYmctc2xhdGUtMTAwIHJvdW5kZWQgdy1mdWxsXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImgtMyBiZy1zbGF0ZS0xMDAgcm91bmRlZCB3LTEvMlwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvbW90aW9uLmRpdj5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxtb3Rpb24uZGl2IFxuICAgICAgICAgICAgICAgICAgICAgIGtleT1cImNhbGVuZGFyXCJcbiAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHg6IDIwIH19XG4gICAgICAgICAgICAgICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB4OiAwIH19XG4gICAgICAgICAgICAgICAgICAgICAgZXhpdD17eyBvcGFjaXR5OiAwLCB4OiAtMjAgfX1cbiAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uPXt7IGR1cmF0aW9uOiAwLjIgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJzcGFjZS15LTJcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAge2Vjb25vbWljRXZlbnRzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlY29ub21pY0V2ZW50cy5tYXAoKGV2ZW50KSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtldmVudC5pZH0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgcC0yIHJvdW5kZWQteGwgaG92ZXI6Ymctc2xhdGUtNTAgdHJhbnNpdGlvbiBib3JkZXIgYm9yZGVyLXRyYW5zcGFyZW50IGhvdmVyOmJvcmRlci1zbGF0ZS0xMDAgZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIG1pbi13LVs0NnB4XSBqdXN0aWZ5LWNlbnRlciBiZy1zbGF0ZS01MCByb3VuZGVkLWxnIHAtMSBzaHJpbmstMCBib3JkZXIgYm9yZGVyLXNsYXRlLTEwMC84MFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2V2ZW50LmRhdGUgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOHB4XSBmb250LWJvbGQgdGV4dC1zbGF0ZS00MDAgdXBwZXJjYXNlIHRyYWNraW5nLXRpZ2h0XCI+e2V2ZW50LmRhdGV9PC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS04MDAgbGVhZGluZy1ub25lIG15LTAuNVwiPntldmVudC50aW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHRleHQtWzlweF0gZm9udC1ibGFjayB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuY3VycmVuY3kgPT09ICdVU0QnID8gJ3RleHQtZW1lcmFsZC02MDAnIDogXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmN1cnJlbmN5ID09PSAnRVVSJyA/ICd0ZXh0LWJsdWUtNjAwJyA6IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5jdXJyZW5jeSA9PT0gJ0dCUCcgPyAndGV4dC1pbmRpZ28tNjAwJyA6ICd0ZXh0LXJvc2UtNjAwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PntldmVudC5jdXJyZW5jeX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTkwMCBsZWFkaW5nLXRpZ2h0IGdyb3VwLWhvdmVyOnRleHQtaW5kaWdvLTYwMCB0cmFuc2l0aW9uXCI+e2V2ZW50LmV2ZW50fTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbXQtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZXZlbnQuaW1wYWN0ID09PSAnaGlnaCcgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTAuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTEuNSBoLTEuNSByb3VuZGVkLWZ1bGwgYmctcm9zZS01MDBcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xLjUgaC0xLjUgcm91bmRlZC1mdWxsIGJnLXJvc2UtNTAwXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMS41IGgtMS41IHJvdW5kZWQtZnVsbCBiZy1yb3NlLTUwMFwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgdGV4dC1bOXB4XSB0ZXh0LXNsYXRlLTUwMCBmb250LW1lZGl1bVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtldmVudC5hY3R1YWwgJiYgPHNwYW4+QWN0OiA8c3BhbiBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC1zbGF0ZS05MDBcIj57ZXZlbnQuYWN0dWFsfTwvc3Bhbj48L3NwYW4+fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtldmVudC5mb3JlY2FzdCAmJiA8c3Bhbj5Fc3Q6IHtldmVudC5mb3JlY2FzdH08L3NwYW4+fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0zIGFuaW1hdGUtcHVsc2VcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge1sxLCAyLCAzXS5tYXAoaSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e2l9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtc3RhcnQgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy04IGgtNiBiZy1zbGF0ZS0xMDAgcm91bmRlZFwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgc3BhY2UteS0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC0zIGJnLXNsYXRlLTEwMCByb3VuZGVkIHctZnVsbFwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImgtMiBiZy1zbGF0ZS0xMDAgcm91bmRlZCB3LTEvMlwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9tb3Rpb24uZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L0FuaW1hdGVQcmVzZW5jZT5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIEZvb3RlciBMaW5rcyAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMiBmbGV4IGZsZXgtd3JhcCBnYXAteC0zIGdhcC15LTIgdGV4dC1bMTBweF0gZm9udC1tZWRpdW0gdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9XCJob3Zlcjp0ZXh0LWluZGlnby02MDAgdHJhbnNpdGlvblwiPkFib3V0PC9hPlxuICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGNsYXNzTmFtZT1cImhvdmVyOnRleHQtaW5kaWdvLTYwMCB0cmFuc2l0aW9uXCI+QWNjZXNzaWJpbGl0eTwvYT5cbiAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9XCJob3Zlcjp0ZXh0LWluZGlnby02MDAgdHJhbnNpdGlvblwiPkhlbHAgQ2VudGVyPC9hPlxuICAgICAgICAgICAgICA8YSBocmVmPVwiI1wiIGNsYXNzTmFtZT1cImhvdmVyOnRleHQtaW5kaWdvLTYwMCB0cmFuc2l0aW9uXCI+UHJpdmFjeSAmIFRlcm1zPC9hPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBwdC0yIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgdGV4dC1zbGF0ZS01MDBcIj5cbiAgICAgICAgICAgICAgICA8VGFyYXB0aUxvZ28gaGVpZ2h0PXsyMn0gLz5cbiAgICAgICAgICAgICAgICA8c3Bhbj7CqSAyMDI2IFRhcmFwdGkgSW5jLjwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDwvYXNpZGU+XG4gICAgICAgICl9XG4gICAgICAgIFxuICAgICAgPC9kaXY+XG5cblxuICAgICAgey8qIEJPVFRPTSBOQVZJR0FUSU9OIEJBUiAqL31cbiAgICAgIHthY3RpdmVWaWV3ICE9PSAnbWVzc2FnZXMnICYmIChcbiAgICAgIDxmb290ZXIgY2xhc3NOYW1lPXtgbGc6aGlkZGVuIGZpeGVkIGJvdHRvbS0wIGxlZnQtMS8yIC10cmFuc2xhdGUteC0xLzIgYmctd2hpdGUgYm9yZGVyLXQgYm9yZGVyLXNsYXRlLTIwMCBweS0zIHB4LTQgdy1mdWxsIG1heC13LWxnIHotNDAgc2hyaW5rLTAgc2hhZG93LVswXy00cHhfMjBweF8tNXB4X3JnYmEoMCwwLDAsMC4wNSldIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTMwMCBlYXNlLWluLW91dCAke2lzRm9vdGVyVmlzaWJsZSA/ICd0cmFuc2xhdGUteS0wIG9wYWNpdHktMTAwJyA6ICd0cmFuc2xhdGUteS1mdWxsIG9wYWNpdHktMCBwb2ludGVyLWV2ZW50cy1ub25lJ31gfT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy01IGdhcC0xIHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgXG4gICAgICAgICAgey8qIE1lbnUgMTogSG9tZS9EYXNoYm9hcmQgKi99XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlVmlldygnZmVlZCcpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEgdHJhbnNpdGlvbiAke1xuICAgICAgICAgICAgICBhY3RpdmVWaWV3ID09PSAnZmVlZCcgPyAndGV4dC1pbmRpZ28tNjAwJyA6ICd0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXNsYXRlLTkwMCdcbiAgICAgICAgICAgIH1gfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1bMjJweF0gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcmVsYXRpdmVcIj5cbiAgICAgICAgICAgICAgPExheW91dERhc2hib2FyZCBzaXplPXsxOH0gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSBmb250LWJsYWNrXCI+RGFzaGJvYXJkPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgey8qIE1lbnUgMjogSm91cm5hbCAoTG9ja2VkKSAqL31cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVWaWV3KCdqb3VybmFsJyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMSB0cmFuc2l0aW9uIHJlbGF0aXZlICR7XG4gICAgICAgICAgICAgIGFjdGl2ZVZpZXcgPT09ICdqb3VybmFsJyA/ICd0ZXh0LWluZGlnby02MDAnIDogJ3RleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtc2xhdGUtOTAwJ1xuICAgICAgICAgICAgfWB9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoLVsyMnB4XSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciByZWxhdGl2ZVwiPlxuICAgICAgICAgICAgICA8Qm9va09wZW4gc2l6ZT17MTh9IC8+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgLXRvcC0xLjUgLXJpZ2h0LTEuNSBiZy1yb3NlLTUwMCB0ZXh0LXdoaXRlIHJvdW5kZWQtZnVsbCBwLVsycHhdIGJvcmRlciBib3JkZXItd2hpdGUgc2hhZG93LXNtIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPExvY2sgc2l6ZT17N30gLz5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gZm9udC1ibGFja1wiPkpvdXJuYWw8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICB7LyogTWVudSAzOiBBY2NvdW50ICovfVxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEFjdGl2ZVZpZXcoJ2FjY291bnQnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xIHRyYW5zaXRpb24gcmVsYXRpdmUgJHtcbiAgICAgICAgICAgICAgYWN0aXZlVmlldyA9PT0gJ2FjY291bnQnID8gJ3RleHQtaW5kaWdvLTYwMCcgOiAndGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1zbGF0ZS05MDAnXG4gICAgICAgICAgICB9YH1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImgtWzIycHhdIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHJlbGF0aXZlXCI+XG4gICAgICAgICAgICAgIDxTaGllbGRDaGVjayBzaXplPXsxOH0gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSBmb250LWJsYWNrXCI+QWNjb3VudDwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIHsvKiBNZW51IDQ6IE91dGxvb2sgKi99XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlVmlldygnb3V0bG9vaycpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEgdHJhbnNpdGlvbiByZWxhdGl2ZSAke1xuICAgICAgICAgICAgICBhY3RpdmVWaWV3ID09PSAnb3V0bG9vaycgPyAndGV4dC1pbmRpZ28tNjAwJyA6ICd0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXNsYXRlLTkwMCdcbiAgICAgICAgICAgIH1gfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1bMjJweF0gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcmVsYXRpdmVcIj5cbiAgICAgICAgICAgICAgPEdsb2JlIHNpemU9ezE4fSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIGZvbnQtYmxhY2tcIj5PdXRsb29rPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgey8qIE1lbnUgNTogUHJvZmlsZSAoTGl2ZSkgKi99XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlVmlldygncHJvZmlsZScpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEgdHJhbnNpdGlvbiAke1xuICAgICAgICAgICAgICBhY3RpdmVWaWV3ID09PSAncHJvZmlsZScgPyAndGV4dC1pbmRpZ28tNjAwJyA6ICd0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXNsYXRlLTkwMCdcbiAgICAgICAgICAgIH1gfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1bMjJweF0gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcmVsYXRpdmVcIj5cbiAgICAgICAgICAgICAgPFVzZXJJY29uIHNpemU9ezE4fSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIGZvbnQtYmxhY2tcIj5Qcm9maWxlPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9mb290ZXI+XG4gICAgICApfVxuXG4gICAgICB7LyogQnJva2VyIENyZWRlbnRpYWxzIFN5bmMgTW9kYWwgKi99XG4gICAgICA8Q29ubmVjdE1vZGFsIFxuICAgICAgICBpc09wZW49e2lzQ29ubmVjdE1vZGFsT3Blbn0gXG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldElzQ29ubmVjdE1vZGFsT3BlbihmYWxzZSl9IFxuICAgICAgLz5cblxuICAgICAgey8qIFBlcmZvcm1hbmNlIENoYXJ0IE1vZGFsIChTbGlkZS1vdmVyKSAqL31cbiAgICAgIDxBbmltYXRlUHJlc2VuY2U+XG4gICAgICAgIHtwZXJmb3JtYW5jZU1ldHJpYyAmJiAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxtb3Rpb24uZGl2IFxuICAgICAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAgfX1cbiAgICAgICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxIH19XG4gICAgICAgICAgICAgIGV4aXQ9e3sgb3BhY2l0eTogMCB9fVxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRQZXJmb3JtYW5jZU1ldHJpYyhudWxsKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZml4ZWQgaW5zZXQtMCBiZy1ibGFjay80MCBiYWNrZHJvcC1ibHVyLXNtIHotWzExMF1cIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxtb3Rpb24uZGl2IFxuICAgICAgICAgICAgICBpbml0aWFsPXt7IHg6ICcxMDAlJyB9fVxuICAgICAgICAgICAgICBhbmltYXRlPXt7IHg6IDAgfX1cbiAgICAgICAgICAgICAgZXhpdD17eyB4OiAnMTAwJScgfX1cbiAgICAgICAgICAgICAgdHJhbnNpdGlvbj17eyB0eXBlOiAnc3ByaW5nJywgZGFtcGluZzogMjUsIHN0aWZmbmVzczogMjAwIH19XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YGZpeGVkIHJpZ2h0LTQgdG9wLTQgYm90dG9tLTQgdy1bODUlXSBtYXgtdy1zbSB6LVsxMjBdIHNoYWRvdy0yeGwgZmxleCBmbGV4LWNvbCByb3VuZGVkLTN4bCBib3JkZXJgfVxuICAgICAgICAgICAgICBzdHlsZT17eyBcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFxuICAgICAgICAgICAgICAgICAgcGVyZm9ybWFuY2VNZXRyaWMgPT09ICdwbCcgPyAnI0YwRkRGNCcgOiBcbiAgICAgICAgICAgICAgICAgIHBlcmZvcm1hbmNlTWV0cmljID09PSAnZHJhd2Rvd24nID8gJyNGRkNBRDAnIDogXG4gICAgICAgICAgICAgICAgICBwZXJmb3JtYW5jZU1ldHJpYyA9PT0gJ3dpbnJhdGUnID8gJyNDRUYzRkMnIDogXG4gICAgICAgICAgICAgICAgICAnI0ZGRjFGMicsXG4gICAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6IFxuICAgICAgICAgICAgICAgICAgcGVyZm9ybWFuY2VNZXRyaWMgPT09ICdwbCcgPyAnI0RDRkNFNycgOiBcbiAgICAgICAgICAgICAgICAgIHBlcmZvcm1hbmNlTWV0cmljID09PSAnc3RyZWFrJyA/ICcjRkZFNEU2JyA6IFxuICAgICAgICAgICAgICAgICAgJyNjYmQ1ZTEnXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC01IGJvcmRlci1iIGJvcmRlci1ibGFjay81IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1iYXNlIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTkwMFwiPlxuICAgICAgICAgICAgICAgICAgICB7cGVyZm9ybWFuY2VNZXRyaWMgPT09ICdwbCcgPyAnWW91ciBQL0wgUGVyZm9ybWFuY2UnIDogXG4gICAgICAgICAgICAgICAgICAgICBwZXJmb3JtYW5jZU1ldHJpYyA9PT0gJ2RyYXdkb3duJyA/ICdEcmF3ZG93biBBbmFseXNpcycgOiBcbiAgICAgICAgICAgICAgICAgICAgIHBlcmZvcm1hbmNlTWV0cmljID09PSAnd2lucmF0ZScgPyAnV2luIFJhdGUgU3RhdGlzdGljcycgOiBcbiAgICAgICAgICAgICAgICAgICAgICdUcmFkaW5nIFN0cmVhayd9XG4gICAgICAgICAgICAgICAgICA8L2gzPlxuICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS03MDAgZm9udC1ib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgbXQtMC41XCI+XG4gICAgICAgICAgICAgICAgICAgIHtwZXJmb3JtYW5jZU1ldHJpYyA9PT0gJ3BsJyA/ICdDdW11bGF0aXZlIEdyb3d0aCcgOiBcbiAgICAgICAgICAgICAgICAgICAgIHBlcmZvcm1hbmNlTWV0cmljID09PSAnZHJhd2Rvd24nID8gJ1Jpc2sgTWFuYWdlbWVudCcgOiBcbiAgICAgICAgICAgICAgICAgICAgIHBlcmZvcm1hbmNlTWV0cmljID09PSAnd2lucmF0ZScgPyAnQWNjdXJhY3kgQnJlYWtkb3duJyA6IFxuICAgICAgICAgICAgICAgICAgICAgJ0NvbnNpc3RlbmN5IFRyYWNrZXInfVxuICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRQZXJmb3JtYW5jZU1ldHJpYyhudWxsKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctOCBoLTggcm91bmRlZC1mdWxsIGJnLWJsYWNrLzUgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1zbGF0ZS03MDAgaG92ZXI6dGV4dC1zbGF0ZS05MDAgaG92ZXI6YmctYmxhY2svMTAgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxYIHNpemU9ezE4fSAvPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy15LWF1dG8gcC01IHNwYWNlLXktNlwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMiBnYXAtM1wiPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZS80MCBiYWNrZHJvcC1ibHVyLW1kIGJvcmRlciBib3JkZXItd2hpdGUvMjAgcm91bmRlZC14bCBwLTMgc2hhZG93LXNtXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlciBibG9jayBtYi0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3BlcmZvcm1hbmNlTWV0cmljID09PSAncGwnID8gJ1RvdGFsIEdhaW4nIDogXG4gICAgICAgICAgICAgICAgICAgICAgIHBlcmZvcm1hbmNlTWV0cmljID09PSAnZHJhd2Rvd24nID8gJ01heCBERCcgOiBcbiAgICAgICAgICAgICAgICAgICAgICAgcGVyZm9ybWFuY2VNZXRyaWMgPT09ICd3aW5yYXRlJyA/ICdUb3RhbCBUcmFkZXMnIDogXG4gICAgICAgICAgICAgICAgICAgICAgICdNYXggU3RyZWFrJ31cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS05MDAgZm9udC1tb25vXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3BlcmZvcm1hbmNlTWV0cmljID09PSAncGwnID8gJyskMSw0MjAnIDogXG4gICAgICAgICAgICAgICAgICAgICAgIHBlcmZvcm1hbmNlTWV0cmljID09PSAnZHJhd2Rvd24nID8gJy00LjIlJyA6IFxuICAgICAgICAgICAgICAgICAgICAgICBwZXJmb3JtYW5jZU1ldHJpYyA9PT0gJ3dpbnJhdGUnID8gJzE0MicgOiBcbiAgICAgICAgICAgICAgICAgICAgICAgJzggRGF5cyd9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZS80MCBiYWNrZHJvcC1ibHVyLW1kIGJvcmRlciBib3JkZXItd2hpdGUvMjAgcm91bmRlZC14bCBwLTMgc2hhZG93LXNtXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlciBibG9jayBtYi0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3BlcmZvcm1hbmNlTWV0cmljID09PSAncGwnID8gJ1dpbiBSYXRlJyA6IFxuICAgICAgICAgICAgICAgICAgICAgICBwZXJmb3JtYW5jZU1ldHJpYyA9PT0gJ2RyYXdkb3duJyA/ICdEYWlseSBERCcgOiBcbiAgICAgICAgICAgICAgICAgICAgICAgcGVyZm9ybWFuY2VNZXRyaWMgPT09ICd3aW5yYXRlJyA/ICdXaW4gUmF0ZScgOiBcbiAgICAgICAgICAgICAgICAgICAgICAgJ0N1cnJlbnQnfVxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ibGFjayB0ZXh0LXNsYXRlLTkwMCBmb250LW1vbm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICB7cGVyZm9ybWFuY2VNZXRyaWMgPT09ICdwbCcgPyAnNjguNCUnIDogXG4gICAgICAgICAgICAgICAgICAgICAgIHBlcmZvcm1hbmNlTWV0cmljID09PSAnZHJhd2Rvd24nID8gJy0xLjIlJyA6IFxuICAgICAgICAgICAgICAgICAgICAgICBwZXJmb3JtYW5jZU1ldHJpYyA9PT0gJ3dpbnJhdGUnID8gJzY4LjQlJyA6IFxuICAgICAgICAgICAgICAgICAgICAgICAnMyBEYXlzJ31cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlLzQwIGJhY2tkcm9wLWJsdXItbWQgYm9yZGVyIGJvcmRlci13aGl0ZS8yMCByb3VuZGVkLTJ4bCBwLTQgc2hhZG93LXNtXCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImgtWzIyMHB4XSB3LWZ1bGxcIj5cbiAgICAgICAgICAgICAgICAgICAgPFJlc3BvbnNpdmVDb250YWluZXIgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxBcmVhQ2hhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE9e1xuICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJmb3JtYW5jZU1ldHJpYyA9PT0gJ3BsJyA/IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGRheTogJ01vbicsIHZhbDogMTIwIH0sIHsgZGF5OiAnVHVlJywgdmFsOiAzNDAgfSwgeyBkYXk6ICdXZWQnLCB2YWw6IC0xNTAgfSwgeyBkYXk6ICdUaHUnLCB2YWw6IDQyMCB9LCB7IGRheTogJ0ZyaScsIHZhbDogMjgwIH0sIHsgZGF5OiAnU2F0JywgdmFsOiA1MTAgfSwgeyBkYXk6ICdTdW4nLCB2YWw6IDI0OCB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIF0gOiBwZXJmb3JtYW5jZU1ldHJpYyA9PT0gJ2RyYXdkb3duJyA/IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGRheTogJ01vbicsIHZhbDogLTEuMiB9LCB7IGRheTogJ1R1ZScsIHZhbDogLTAuNSB9LCB7IGRheTogJ1dlZCcsIHZhbDogLTMuNCB9LCB7IGRheTogJ1RodScsIHZhbDogLTEuMSB9LCB7IGRheTogJ0ZyaScsIHZhbDogLTAuOCB9LCB7IGRheTogJ1NhdCcsIHZhbDogLTQuMiB9LCB7IGRheTogJ1N1bicsIHZhbDogLTIuMSB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIF0gOiBwZXJmb3JtYW5jZU1ldHJpYyA9PT0gJ3dpbnJhdGUnID8gW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgZGF5OiAnTW9uJywgdmFsOiA2MCB9LCB7IGRheTogJ1R1ZScsIHZhbDogNzUgfSwgeyBkYXk6ICdXZWQnLCB2YWw6IDQ1IH0sIHsgZGF5OiAnVGh1JywgdmFsOiA4MiB9LCB7IGRheTogJ0ZyaScsIHZhbDogNjggfSwgeyBkYXk6ICdTYXQnLCB2YWw6IDcyIH0sIHsgZGF5OiAnU3VuJywgdmFsOiA2NSB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIF0gOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBkYXk6ICdNb24nLCB2YWw6IDIgfSwgeyBkYXk6ICdUdWUnLCB2YWw6IDQgfSwgeyBkYXk6ICdXZWQnLCB2YWw6IDEgfSwgeyBkYXk6ICdUaHUnLCB2YWw6IDUgfSwgeyBkYXk6ICdGcmknLCB2YWw6IDMgfSwgeyBkYXk6ICdTYXQnLCB2YWw6IDggfSwgeyBkYXk6ICdTdW4nLCB2YWw6IDMgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW49e3sgdG9wOiAxMCwgcmlnaHQ6IDEwLCBsZWZ0OiAtMjAsIGJvdHRvbTogMCB9fVxuICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkZWZzPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8bGluZWFyR3JhZGllbnQgaWQ9XCJjb2xvck1ldHJpY1wiIHgxPVwiMFwiIHkxPVwiMFwiIHgyPVwiMFwiIHkyPVwiMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdG9wIG9mZnNldD1cIjUlXCIgc3RvcENvbG9yPXtwZXJmb3JtYW5jZU1ldHJpYyA9PT0gJ2RyYXdkb3duJyA/ICcjRTExRDQ4JyA6ICcjMDAwJ30gc3RvcE9wYWNpdHk9ezAuMX0vPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdG9wIG9mZnNldD1cIjk1JVwiIHN0b3BDb2xvcj17cGVyZm9ybWFuY2VNZXRyaWMgPT09ICdkcmF3ZG93bicgPyAnI0UxMUQ0OCcgOiAnIzAwMCd9IHN0b3BPcGFjaXR5PXswfS8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvbGluZWFyR3JhZGllbnQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2RlZnM+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Q2FydGVzaWFuR3JpZCBzdHJva2VEYXNoYXJyYXk9XCIzIDNcIiB2ZXJ0aWNhbD17ZmFsc2V9IHN0cm9rZT1cInJnYmEoMCwwLDAsMC4wNSlcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFhBeGlzIFxuICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhS2V5PVwiZGF5XCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF4aXNMaW5lPXtmYWxzZX0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpY2tMaW5lPXtmYWxzZX0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpY2s9e3sgZm9udFNpemU6IDEwLCBmb250V2VpZ2h0OiA3MDAsIGZpbGw6ICdyZ2JhKDAsMCwwLDAuNCknIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGR5PXsxMH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8WUF4aXMgXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF4aXNMaW5lPXtmYWxzZX0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpY2tMaW5lPXtmYWxzZX0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpY2s9e3sgZm9udFNpemU6IDEwLCBmb250V2VpZ2h0OiA3MDAsIGZpbGw6ICdyZ2JhKDAsMCwwLDAuNCknIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFRvb2x0aXAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRTdHlsZT17eyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICcxMnB4JywgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJveFNoYWRvdzogJzAgMTBweCAxNXB4IC0zcHggcmdiKDAgMCAwIC8gMC4xKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxMXB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiAnNjAwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOSknXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPEFyZWEgXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJtb25vdG9uZVwiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhS2V5PVwidmFsXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZT17cGVyZm9ybWFuY2VNZXRyaWMgPT09ICdkcmF3ZG93bicgPyAnI0UxMUQ0OCcgOiAncmdiYSgwLDAsMCwwLjUpJ30gXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoPXsyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxsT3BhY2l0eT17MX0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGw9XCJ1cmwoI2NvbG9yTWV0cmljKVwiIFxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8L0FyZWFDaGFydD5cbiAgICAgICAgICAgICAgICAgICAgPC9SZXNwb25zaXZlQ29udGFpbmVyPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktM1wiPlxuICAgICAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTgwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0XCI+XG4gICAgICAgICAgICAgICAgICAgIHtwZXJmb3JtYW5jZU1ldHJpYyA9PT0gJ3BsJyA/ICdQL0wgSW5zaWdodHMnIDogXG4gICAgICAgICAgICAgICAgICAgICBwZXJmb3JtYW5jZU1ldHJpYyA9PT0gJ2RyYXdkb3duJyA/ICdSaXNrIEluc2lnaHRzJyA6IFxuICAgICAgICAgICAgICAgICAgICAgcGVyZm9ybWFuY2VNZXRyaWMgPT09ICd3aW5yYXRlJyA/ICdBY2N1cmFjeSBJbnNpZ2h0cycgOiBcbiAgICAgICAgICAgICAgICAgICAgICdTdHJlYWsgSW5zaWdodHMnfVxuICAgICAgICAgICAgICAgICAgPC9oND5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtM1wiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBiZy13aGl0ZS80MCBiYWNrZHJvcC1ibHVyLW1kIGJvcmRlciBib3JkZXItd2hpdGUvMjAgcm91bmRlZC14bCBwLTMgc2hhZG93LXNtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtYi0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7cGVyZm9ybWFuY2VNZXRyaWMgPT09ICdkcmF3ZG93bicgPyA8U2hpZWxkQWxlcnQgc2l6ZT17MTR9IGNsYXNzTmFtZT1cInRleHQtcm9zZS02MDBcIiAvPiA6IDxUcmVuZGluZ1VwIHNpemU9ezE0fSBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTkwMFwiIC8+fVxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtOTAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtwZXJmb3JtYW5jZU1ldHJpYyA9PT0gJ3BsJyA/ICdCZXN0IERheScgOiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcmZvcm1hbmNlTWV0cmljID09PSAnZHJhd2Rvd24nID8gJ1dhcm5pbmcnIDogXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJmb3JtYW5jZU1ldHJpYyA9PT0gJ3dpbnJhdGUnID8gJ1RvcCBQYWlyJyA6IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0Jlc3QgV2Vlayd9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS04MDAgbGVhZGluZy1yZWxheGVkIGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3BlcmZvcm1hbmNlTWV0cmljID09PSAncGwnID8gJ1NhdHVyZGF5IHlpZWxkZWQgbWF4aW11bSByZXR1cm5zIHdpdGggKyQ1MTAgbmV0IHByb2ZpdC4nIDogXG4gICAgICAgICAgICAgICAgICAgICAgICAgcGVyZm9ybWFuY2VNZXRyaWMgPT09ICdkcmF3ZG93bicgPyAnREQgcGVha2VkIGF0IC00LjIlIG9uIFNhdHVyZGF5LiBBdm9pZCBvdmVyLWxldmVyYWdpbmcuJyA6IFxuICAgICAgICAgICAgICAgICAgICAgICAgIHBlcmZvcm1hbmNlTWV0cmljID09PSAnd2lucmF0ZScgPyAnWEFVL1VTRCBtYWludGFpbnMgeW91ciBoaWdoZXN0IHdpbiByYXRlIGF0IDc0JS4nIDogXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ1lvdXIgOC1kYXkgc3RyZWFrIGluIE1heSByZW1haW5zIHlvdXIgYWxsLXRpbWUgY29uc2lzdGVuY3kgcmVjb3JkLid9XG4gICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNSBiZy1ibGFjay81IGJvcmRlci10IGJvcmRlci1ibGFjay81XCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFBlcmZvcm1hbmNlTWV0cmljKG51bGwpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB5LTMgYmctc2xhdGUtOTAwIGhvdmVyOmJnLXNsYXRlLTgwMCB0ZXh0LXdoaXRlIGZvbnQtYm9sZCB0ZXh0LXhzIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3Qgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCBzaGFkb3ctbGdcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIENsb3NlIEluc2lnaHRzXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9tb3Rpb24uZGl2PlxuICAgICAgICAgIDwvPlxuICAgICAgICApfVxuICAgICAgPC9BbmltYXRlUHJlc2VuY2U+XG5cbiAgICAgIHsvKiBQcmVtaXVtIFRvYXN0IE5vdGlmaWNhdGlvbiBvdmVybGF5ICovfVxuICAgICAge3RvYXN0TWVzc2FnZSAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZml4ZWQgYm90dG9tLTI0IGxlZnQtMS8yIC10cmFuc2xhdGUteC0xLzIgYmctWyMxMjE2MjBdIGJvcmRlciBib3JkZXItZ3JheS04MDAvODAgdGV4dC1ncmF5LTIwMCBweC00IHB5LTMgcm91bmRlZC0yeGwgc2hhZG93LTJ4bCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41IHotNTAgbWF4LXctc20gdy1bOTAlXSBqdXN0aWZ5LWNlbnRlciBmb250LWJvbGQgdGV4dC14cyBhbmltYXRlLWluIGZhZGUtaW4gc2xpZGUtaW4tZnJvbS1ib3R0b20tNSBkdXJhdGlvbi0zMDBcIj5cbiAgICAgICAgICA8QWN0aXZpdHkgc2l6ZT17MTR9IGNsYXNzTmFtZT1cInRleHQtaW5kaWdvLTQwMCBhbmltYXRlLXB1bHNlXCIgLz5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlclwiPnt0b2FzdE1lc3NhZ2V9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBNRVNTQUdJTkcgQkFSIChMaW5rZWRJbiBTdHlsZSkgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT17YGZpeGVkIGJvdHRvbS0wIHJpZ2h0LTQgdy03MiBiZy13aGl0ZSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCByb3VuZGVkLXQtbGcgc2hhZG93LVswXy00cHhfMTJweF8tMnB4X3JnYmEoMCwwLDAsMC4xKV0gei1bMTAwXSBoaWRkZW4gbGc6ZmxleCBmbGV4LWNvbCBvdmVyZmxvdy1oaWRkZW4gdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwICR7aXNNZXNzYWdpbmdFeHBhbmRlZCA/ICdoLVs1MDBweF0nIDogJ2gtMTInfWB9PlxuICAgICAgICA8ZGl2IFxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldElzTWVzc2FnaW5nRXhwYW5kZWQoIWlzTWVzc2FnaW5nRXhwYW5kZWQpfVxuICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTEwMCBjdXJzb3ItcG9pbnRlciBob3ZlcjpiZy1zbGF0ZS01MCBzaHJpbmstMFwiXG4gICAgICAgID5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy04IGgtOCByb3VuZGVkLWZ1bGwgYmctc2xhdGUtMjAwIG92ZXJmbG93LWhpZGRlbiByaW5nLTEgcmluZy1zbGF0ZS0xMDBcIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz17Y3VycmVudFVzZXI/LmF2YXRhciAmJiBjdXJyZW50VXNlci5hdmF0YXIubGVuZ3RoID4gMiA/IGN1cnJlbnRVc2VyLmF2YXRhciA6IGBodHRwczovL2FwaS5kaWNlYmVhci5jb20vNy54L2F2YXRhYWFycy9zdmc/c2VlZD0ke2N1cnJlbnRVc2VyPy51c2VybmFtZSB8fCAndXNlcid9YH0gYWx0PVwibWVcIiBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlclwiIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGJvdHRvbS0wIHJpZ2h0LTAgdy0yLjUgaC0yLjUgYmctZW1lcmFsZC01MDAgYm9yZGVyLTIgYm9yZGVyLXdoaXRlIHJvdW5kZWQtZnVsbFwiPjwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxM3B4XSBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDBcIj5NZXNzYWdpbmc8L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMC41XCI+XG4gICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cInAtMS41IGhvdmVyOmJnLXNsYXRlLTEwMCByb3VuZGVkLWZ1bGwgdHJhbnNpdGlvblwiIG9uQ2xpY2s9eyhlKSA9PiB7IGUuc3RvcFByb3BhZ2F0aW9uKCk7IH19PjxNb3JlSG9yaXpvbnRhbCBzaXplPXsxNn0gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS02MDBcIiAvPjwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJwLTEuNSBob3ZlcjpiZy1zbGF0ZS0xMDAgcm91bmRlZC1mdWxsIHRyYW5zaXRpb25cIiBvbkNsaWNrPXsoZSkgPT4geyBlLnN0b3BQcm9wYWdhdGlvbigpOyBzZXRJc01lc3NhZ2luZ0V4cGFuZGVkKHRydWUpOyBzZXRJc01lc3NhZ2luZ05ld0NoYXQodHJ1ZSk7IH19PjxTcXVhcmVQZW4gc2l6ZT17MTZ9IGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNjAwXCIgLz48L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwicC0xLjUgaG92ZXI6Ymctc2xhdGUtMTAwIHJvdW5kZWQtZnVsbCB0cmFuc2l0aW9uXCI+XG4gICAgICAgICAgICAgIHtpc01lc3NhZ2luZ0V4cGFuZGVkID8gPENoZXZyb25Eb3duIHNpemU9ezE4fSBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTYwMFwiIC8+IDogPENoZXZyb25VcCBzaXplPXsxOH0gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS02MDBcIiAvPn1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgXG4gICAgICAgIHsvKiBFeHBhbmRlZCBjb250ZW50ICovfVxuICAgICAgICB7aXNNZXNzYWdpbmdOZXdDaGF0ID8gKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIGJnLXdoaXRlXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTEwMFwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxNHB4XSBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDBcIj5QZXNhbiBiYXJ1PC9zcGFuPlxuICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldElzTWVzc2FnaW5nTmV3Q2hhdChmYWxzZSl9IGNsYXNzTmFtZT1cInAtMSBob3ZlcjpiZy1zbGF0ZS0xMDAgcm91bmRlZC1tZCB0ZXh0LXNsYXRlLTUwMFwiPlxuICAgICAgICAgICAgICAgIDxYIHNpemU9ezE2fSAvPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTIgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTEwMFwiPlxuICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIiBcbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIktldGlrIHNhdHUgbmFtYSBhdGF1IGxlYmloXCIgXG4gICAgICAgICAgICAgICAgdmFsdWU9e21lc3NhZ2luZ1NlYXJjaFF1ZXJ5fVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0TWVzc2FnaW5nU2VhcmNoUXVlcnkoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy13aGl0ZSBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLWZ1bGwgcHktMS41IHB4LTQgdGV4dC1bMTNweF0gZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBvdXRsaW5lLW5vbmUgcGxhY2Vob2xkZXItc2xhdGUtNTAwXCJcbiAgICAgICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIG5vLXNjcm9sbGJhclwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMiB0ZXh0LVsxMnB4XSBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNTAwIGJnLXNsYXRlLTUwLzUwXCI+RGlzYXJhbmthbjwvZGl2PlxuICAgICAgICAgICAgICB7bWVzc2FnaW5nVXNlcnMuZmlsdGVyKHUgPT4gdS5pZCAhPT0gY3VycmVudFVzZXI/LmlkICYmIGAke3UuZmlyc3ROYW1lfSAke3UubGFzdE5hbWV9ICR7dS51c2VybmFtZX1gLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMobWVzc2FnaW5nU2VhcmNoUXVlcnkudG9Mb3dlckNhc2UoKSkpLm1hcCh1ID0+IChcbiAgICAgICAgICAgICAgICAgPGRpdiBcbiAgICAgICAgICAgICAgICAgICBrZXk9e3UuaWR9XG4gICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geyBzZXRBY3RpdmVWaWV3KCdtZXNzYWdlcycpOyBzZXRBY3RpdmVDaGF0UGFydG5lcklkKHUuaWQpOyBzZXRJc01lc3NhZ2luZ05ld0NoYXQoZmFsc2UpOyBzZXRJc01lc3NhZ2luZ0V4cGFuZGVkKGZhbHNlKTsgfX1cbiAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTIgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgaG92ZXI6Ymctc2xhdGUtNTAgY3Vyc29yLXBvaW50ZXIgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTUwLzUwXCJcbiAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTAgaC0xMCByb3VuZGVkLWZ1bGwgb3ZlcmZsb3ctaGlkZGVuIGJnLXNsYXRlLTIwMCBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXt1LmF2YXRhcj8uc3RhcnRzV2l0aCgnaHR0cCcpID8gdS5hdmF0YXIgOiBgaHR0cHM6Ly9hcGkuZGljZWJlYXIuY29tLzcueC9hdmF0YWFhcnMvc3ZnP3NlZWQ9JHt1LnVzZXJuYW1lfWB9IGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvdmVyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzEzcHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTkwMCBsZWFkaW5nLXRpZ2h0IHRydW5jYXRlXCI+e3UuZmlyc3ROYW1lfSB7dS5sYXN0TmFtZX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwIHRydW5jYXRlXCI+e3UuaGVhZGxpbmUgfHwgdS5iaW8gfHwgJ01lbWJlciBvZiBUYXJhcHRpJ308L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAge21lc3NhZ2luZ1VzZXJzLmZpbHRlcih1ID0+IHUuaWQgIT09IGN1cnJlbnRVc2VyPy5pZCAmJiBgJHt1LmZpcnN0TmFtZX0gJHt1Lmxhc3ROYW1lfSAke3UudXNlcm5hbWV9YC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKG1lc3NhZ2luZ1NlYXJjaFF1ZXJ5LnRvTG93ZXJDYXNlKCkpKS5sZW5ndGggPT09IDAgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtNCBweS04IHRleHQtY2VudGVyIHRleHQtWzEycHhdIHRleHQtc2xhdGUtNTAwXCI+XG4gICAgICAgICAgICAgICAgICBUaWRhayBhZGEgcGVuZ2d1bmEgZGl0ZW11a2FuLlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgZmxleCBmbGV4LWNvbCBvdmVyZmxvdy1oaWRkZW4gYmctd2hpdGVcIj5cbiAgICAgICAgICAgICB7LyogU2VhcmNoIEJhciAqL31cbiAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTMgcHktMlwiPlxuICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZVwiPlxuICAgICAgICAgICAgICAgICA8U2VhcmNoIHNpemU9ezE0fSBjbGFzc05hbWU9XCJhYnNvbHV0ZSBsZWZ0LTMgdG9wLTEvMiAtdHJhbnNsYXRlLXktMS8yIHRleHQtc2xhdGUtNDAwXCIgLz5cbiAgICAgICAgICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCIgXG4gICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJTZWFyY2ggbWVzc2FnZXNcIiBcbiAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctWyNlZWYzZjhdIGJvcmRlci1ub25lIHJvdW5kZWQtbWQgcHktMS41IHBsLTkgcHItOCB0ZXh0LVsxM3B4XSBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1zbGF0ZS0zMDAgcGxhY2Vob2xkZXItc2xhdGUtNTAwXCJcbiAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJhYnNvbHV0ZSByaWdodC0zIHRvcC0xLzIgLXRyYW5zbGF0ZS15LTEvMiB0ZXh0LXNsYXRlLTUwMCBob3Zlcjp0ZXh0LXNsYXRlLTkwMFwiPlxuICAgICAgICAgICAgICAgICAgIDxTZXR0aW5ncyBzaXplPXsxNH0gLz5cbiAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICA8L2Rpdj5cbiAgXG4gICAgICAgICAgICAgey8qIFRhYnMgKi99XG4gICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGJvcmRlci1iIGJvcmRlci1zbGF0ZS0xMDBcIj5cbiAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiZmxleC0xIHB5LTIgdGV4dC1bMTNweF0gZm9udC1ib2xkIHRleHQtaW5kaWdvLTYwMCBib3JkZXItYi0yIGJvcmRlci1pbmRpZ28tNjAwXCI+Rm9jdXNlZDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJmbGV4LTEgcHktMiB0ZXh0LVsxM3B4XSBmb250LWJvbGQgdGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC1zbGF0ZS05MDAgdHJhbnNpdGlvblwiPk90aGVyPC9idXR0b24+XG4gICAgICAgICAgICAgPC9kaXY+XG4gIFxuICAgICAgICAgICAgIHsvKiBNZXNzYWdlcyBMaXN0ICovfVxuICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG92ZXJmbG93LXktYXV0byBuby1zY3JvbGxiYXJcIj5cbiAgICAgICAgICAgICAgIHtzZXNzaW9ucy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgcHktMTAgcHgtNCB0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIGZvbnQtbWVkaXVtXCI+XG4gICAgICAgICAgICAgICAgICAgQmVsdW0gYWRhIHBlc2FuLiBDYXJpIGtvbmVrc2kgZGkgaGFsYW1hbiBOZXR3b3JrLlxuICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgIHNlc3Npb25zLm1hcCgobXNnKSA9PiB7XG4gICAgICAgICAgICAgICAgIGNvbnN0IGlzR3JvdXAgPSBtc2cudXNlcklkLnN0YXJ0c1dpdGgoJ2dyb3VwXycpO1xuICAgICAgICAgICAgICAgICBjb25zdCBhdmF0YXJTcmMgPSBpc0dyb3VwID8gdW5kZWZpbmVkIDogKG1zZy5hdmF0YXIgJiYgbXNnLmF2YXRhci5zdGFydHNXaXRoKCdodHRwJykgPyBtc2cuYXZhdGFyIDogYGh0dHBzOi8vYXBpLmRpY2ViZWFyLmNvbS83LngvYXZhdGFhYXJzL3N2Zz9zZWVkPSR7bXNnLnVzZXJuYW1lfWApO1xuICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgY29uc3QgZm9ybWF0VGltZSA9IChpc28/OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICBpZiAoIWlzbykgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBuZXcgRGF0ZShpc28pO1xuICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICBpZiAoZC5nZXREYXRlKCkgPT09IHRvZGF5LmdldERhdGUoKSAmJiBkLmdldE1vbnRoKCkgPT09IHRvZGF5LmdldE1vbnRoKCkgJiYgZC5nZXRGdWxsWWVhcigpID09PSB0b2RheS5nZXRGdWxsWWVhcigpKSB7XG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gZC50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHsgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JywgaG91cjEyOiBmYWxzZSB9KS5yZXBsYWNlKCc6JywgJy4nKTtcbiAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke2QuZ2V0RGF0ZSgpfSAke1snSmFuJywnRmViJywnTWFyJywnQXByJywnTWF5JywnSnVuJywnSnVsJywnQXVnJywnU2VwJywnT2N0JywnTm92JywnRGVjJ11bZC5nZXRNb250aCgpXX1gO1xuICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgPGRpdiBcbiAgICAgICAgICAgICAgICAgICAgIGtleT17bXNnLnVzZXJJZH1cbiAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0QWN0aXZlVmlldygnbWVzc2FnZXMnKTsgc2V0QWN0aXZlQ2hhdFBhcnRuZXJJZChtc2cudXNlcklkKTsgc2V0SXNNZXNzYWdpbmdFeHBhbmRlZChmYWxzZSk7IH19XG4gICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTMgZmxleCBnYXAtMyBob3ZlcjpiZy1zbGF0ZS01MCBjdXJzb3ItcG9pbnRlciB0cmFuc2l0aW9uIGJvcmRlci1iIGJvcmRlci1zbGF0ZS01MC81MFwiXG4gICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YHctMTIgaC0xMiByb3VuZGVkLWZ1bGwgb3ZlcmZsb3ctaGlkZGVuIGJvcmRlciBib3JkZXItc2xhdGUtMTAwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGZvbnQtYm9sZCB0ZXh0LXdoaXRlICR7aXNHcm91cCA/ICdiZy1ncmFkaWVudC10by10ciBmcm9tLWluZGlnby01MDAgdG8taW5kaWdvLTcwMCcgOiAnYmctc2xhdGUtMjAwJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICB7YXZhdGFyU3JjID8gPGltZyBzcmM9e2F2YXRhclNyY30gYWx0PXttc2cuZmlyc3ROYW1lfSBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlclwiIC8+IDogbXNnLmF2YXRhcn1cbiAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgIHttc2cudW5yZWFkQ291bnQgPiAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGJvdHRvbS0wIHJpZ2h0LTAgdy0zIGgtMyBiZy1lbWVyYWxkLTUwMCBib3JkZXItMiBib3JkZXItd2hpdGUgcm91bmRlZC1mdWxsXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1iYXNlbGluZSBtYi0wLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC1bMTNweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtOTAwIHRydW5jYXRlXCI+e21zZy5maXJzdE5hbWV9IHttc2cubGFzdE5hbWV9PC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCBzaHJpbmstMCBtbC0yXCI+e2Zvcm1hdFRpbWUobXNnLmxhc3RNZXNzYWdlVGltZSl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS01MDAgdHJ1bmNhdGUgbGVhZGluZy1yZWxheGVkXCI+e21zZy5sYXN0TWVzc2FnZX08L3A+XG4gICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgKX1cbiAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQXBwKCkge1xuICByZXR1cm4gKFxuICAgIDxFcnJvckJvdW5kYXJ5PlxuICAgICAgPEFwcFByb3ZpZGVyPlxuICAgICAgICA8TWFpbkFwcExheW91dCAvPlxuICAgICAgPC9BcHBQcm92aWRlcj5cbiAgICA8L0Vycm9yQm91bmRhcnk+XG4gICk7XG59XG4iXSwibWFwcGluZ3MiOiJBQXlZYSxTQThISyxVQTlITDtBQXpZYjtBQUFBO0FBQUE7QUFBQTtBQUtBLFNBQVMsaUJBQWlCO0FBQzFCLE9BQU8sU0FBUyxVQUFVLFdBQVcsY0FBYztBQUduRCxTQUFTLGFBQWEsY0FBYztBQUNwQyxTQUFTLGtCQUFrQjtBQUMzQixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGVBQWU7QUFFeEIsU0FBUyxtQkFBbUI7QUFDNUIsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxlQUFlO0FBRXhCLFNBQVMsZUFBZTtBQUN4QixTQUFTLGVBQWU7QUFDeEIsTUFBTSxrQkFBa0IsTUFBTSxLQUFLLE9BQU87QUFDMUMsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsWUFBWTtBQUNyQixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLG1CQUFtQjtBQUM1QixTQUFTLGlCQUFpQjtBQUMxQixTQUFTLG1CQUFtQjtBQUM1QixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLGtDQUFrQztBQUMzQyxTQUFTLCtCQUErQiw4QkFBOEI7QUFFdEUsU0FBUyxtQkFBbUI7QUFDNUIsU0FBUyxxQkFBcUI7QUFHOUI7QUFBQSxFQUNFO0FBQUEsRUFBTTtBQUFBLEVBQWU7QUFBQSxFQUFRO0FBQUEsRUFBYztBQUFBLEVBQzNDO0FBQUEsRUFBaUI7QUFBQSxFQUF3QjtBQUFBLEVBQVUsUUFBUTtBQUFBLEVBQ3pD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QUFBQSxvQkFBRyxFQUFFLEtBQUssT0FBTyxLQUFLLElBQUk7QUFBQSxvQkFBRyxFQUFFLEtBQUssT0FBTyxLQUFLLElBQUk7QUFBQSxvQkFBRyxFQUFFLEtBQUssT0FBTyxLQUFLLElBQUk7QUFBQSxrQkFDdEwsSUFBSSxzQkFBc0IsYUFBYTtBQUFBLG9CQUNyQyxFQUFFLEtBQUssT0FBTyxLQUFLLEtBQUs7QUFBQSxvQkFBRyxFQUFFLEtBQUssT0FBTyxLQUFLLEtBQUs7QUFBQSxvQkFBRyxFQUFFLEtBQUssT0FBTyxLQUFLLEtBQUs7QUFBQSxvQkFBRyxFQUFFLEtBQUssT0FBTyxLQUFLLEtBQUs7QUFBQSxvQkFBRyxFQUFFLEtBQUssT0FBTyxLQUFLLEtBQUs7QUFBQSxvQkFBRyxFQUFFLEtBQUssT0FBTyxLQUFLLEtBQUs7QUFBQSxvQkFBRyxFQUFFLEtBQUssT0FBTyxLQUFLLEtBQUs7QUFBQSxrQkFDNUwsSUFBSSxzQkFBc0IsWUFBWTtBQUFBLG9CQUNwQyxFQUFFLEtBQUssT0FBTyxLQUFLLEdBQUc7QUFBQSxvQkFBRyxFQUFFLEtBQUssT0FBTyxLQUFLLEdBQUc7QUFBQSxvQkFBRyxFQUFFLEtBQUssT0FBTyxLQUFLLEdBQUc7QUFBQSxvQkFBRyxFQUFFLEtBQUssT0FBTyxLQUFLLEdBQUc7QUFBQSxvQkFBRyxFQUFFLEtBQUssT0FBTyxLQUFLLEdBQUc7QUFBQSxvQkFBRyxFQUFFLEtBQUssT0FBTyxLQUFLLEdBQUc7QUFBQSxvQkFBRyxFQUFFLEtBQUssT0FBTyxLQUFLLEdBQUc7QUFBQSxrQkFDOUssSUFBSTtBQUFBLG9CQUNGLEVBQUUsS0FBSyxPQUFPLEtBQUssRUFBRTtBQUFBLG9CQUFHLEVBQUUsS0FBSyxPQUFPLEtBQUssRUFBRTtBQUFBLG9CQUFHLEVBQUUsS0FBSyxPQUFPLEtBQUssRUFBRTtBQUFBLG9CQUFHLEVBQUUsS0FBSyxPQUFPLEtBQUssRUFBRTtBQUFBLG9CQUFHLEVBQUUsS0FBSyxPQUFPLEtBQUssRUFBRTtBQUFBLG9CQUFHLEVBQUUsS0FBSyxPQUFPLEtBQUss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