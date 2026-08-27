const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldProfileMenu = `              {/* Profile Avatar Button (clean without overlay) */}
              <div className="relative ml-2 sm:ml-4 pl-2 sm:pl-3 border-l border-slate-200/80 flex items-center">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-md border-2 border-white overflow-hidden hover:scale-105 transition shrink-0 cursor-pointer"
                  title="Profile / Profil"
                >
                  {currentUser?.avatar && currentUser.avatar.length > 2 ? (
                    <img src={currentUser.avatar} className="w-full h-full object-cover" alt="Avatar" referrerPolicy="no-referrer" />
                  ) : (
                    currentUser?.avatar || "👤"
                  )}
                </button>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <>
                    {/* Backdrop to close menu */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsProfileMenuOpen(false)}
                    />
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute top-full right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden"
                    >
                      <div className="p-1.5">
                        <button
                          onClick={() => {
                            setActiveView('profile');
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition cursor-pointer"
                        >
                          <UserIcon size={14} />
                          Edit Profile
                        </button>
                        
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        >
                          <LogOut size={14} />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>`;

const newProfileMenu = `              {/* Profile Avatar Button (clean without overlay) */}
              <div className="ml-2 sm:ml-4 pl-2 sm:pl-3 border-l border-slate-200/80 flex items-center">
                <div className="relative flex items-center justify-center">
                  <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-md border-2 border-white overflow-hidden hover:scale-105 transition shrink-0 cursor-pointer"
                    title="Profile / Profil"
                  >
                    {currentUser?.avatar && currentUser.avatar.length > 2 ? (
                      <img src={currentUser.avatar} className="w-full h-full object-cover" alt="Avatar" referrerPolicy="no-referrer" />
                    ) : (
                      currentUser?.avatar || "👤"
                    )}
                  </button>

                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <>
                        {/* Backdrop to close menu */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsProfileMenuOpen(false)}
                        />
                        
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute top-[calc(100%+12px)] right-0 w-36 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden"
                        >
                          <div className="p-1.5">
                            <button
                              onClick={() => {
                                setActiveView('profile');
                                setIsProfileMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition cursor-pointer"
                            >
                              <UserIcon size={14} />
                              Edit Profile
                            </button>
                            
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            >
                              <LogOut size={14} />
                              Logout
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
            </div>`;

if (code.includes("Profile Avatar Button (clean without overlay)")) {
  code = code.replace(oldProfileMenu, newProfileMenu);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched profile menu position");
} else {
  console.log("Could not find the target string in App.tsx");
}
