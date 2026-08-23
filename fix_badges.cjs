const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const rightTrayCode = `<div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3.5">`;

content = content.replace(
  `          {/* Right Header Tray */}
          <div className="flex items-center gap-3.5">`,
  `          {/* Right Header Tray */}
          ${rightTrayCode}`
);

// close the right tray div, right after the end of the original flex row.
content = content.replace(
  `              </AnimatePresence>
            </div>
          </div>
        </div>`,
  `              </AnimatePresence>
            </div>
          </div>
          
          {/* Domisili Badges under search icon */}
          <div className="flex items-center gap-1.5 pt-1">
            {currentUser?.city && (() => {
              const cityKey = currentUser.city?.toLowerCase().replace(/\\s+/g, '_');
              const cityGroupId = \`group_city_\${cityKey}\`;
              const unread = sessions.find((s: any) => s.userId === cityGroupId)?.unreadCount || 0;
              return (
                <button 
                  onClick={() => {
                    setActiveView('messages');
                    setActiveChatPartnerId(cityGroupId);
                  }}
                  className="relative flex items-center gap-1.5 px-2.5 py-1 bg-[#1864E5] text-white rounded-md text-[10px] font-bold whitespace-nowrap shrink-0 border border-[#1864E5]/80 hover:bg-[#1864E5]/90 shadow-sm transition"
                >
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-white"></span>
                    </span>
                  )}
                  <MapPin size={10} className="text-white fill-white/20" />
                  {currentUser.city}
                </button>
              );
            })()}
            {currentUser?.province && (() => {
              const provinceKey = currentUser.province?.toLowerCase().replace(/\\s+/g, '_');
              const provinceGroupId = \`group_province_\${provinceKey}\`;
              const unread = sessions.find((s: any) => s.userId === provinceGroupId)?.unreadCount || 0;
              return (
                <button 
                  onClick={() => {
                    setActiveView('messages');
                    setActiveChatPartnerId(provinceGroupId);
                  }}
                  className="relative flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 text-white rounded-md text-[10px] font-bold whitespace-nowrap shrink-0 border border-indigo-500 hover:bg-indigo-500 shadow-sm transition"
                >
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-white"></span>
                    </span>
                  )}
                  <MapPin size={10} className="text-white fill-white/20" />
                  {currentUser.province}
                </button>
              );
            })()}
          </div>
          </div>
        </div>`
);

// We need to also change `div className="flex items-center justify-between"` to `items-start justify-between` to let the right tray hang down.
content = content.replace(
  `        {/* Top Header Row: Branding, Quick Stats, Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <TaraptiLogo height={40} />`,
  `        {/* Top Header Row: Branding, Quick Stats, Actions */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 mt-1.5">
            <TaraptiLogo height={32} />`
);

// We should also remove the old badges from both places
const domisiliStart1 = `          {/* Domisili Badges */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">`;
const domisiliEnd1 = `          </div>
        </div>

        {/* WEB ONLY: Center Navigation + Domisili Badges aligned side-by-side */}`;

const idx1 = content.indexOf(domisiliStart1);
const idx2 = content.indexOf(domisiliEnd1);
if (idx1 !== -1 && idx2 !== -1) {
  content = content.substring(0, idx1) + `        </div>\n\n        {/* WEB ONLY: Center Navigation + Domisili Badges aligned side-by-side */}` + content.substring(idx2 + domisiliEnd1.length);
}

const domisiliStart2 = `          {/* Domisili Badges aligned to the right (under search/right tray) */}
          <div className="flex items-center gap-2 shrink-0">`;
const domisiliEnd2 = `          </div>
        </div>
        
        </div>
      </header>`;
const idx3 = content.indexOf(domisiliStart2);
const idx4 = content.indexOf(domisiliEnd2);
if (idx3 !== -1 && idx4 !== -1) {
  content = content.substring(0, idx3) + `        </div>\n        \n        </div>\n      </header>` + content.substring(idx4 + domisiliEnd2.length);
}

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log('Done fixing App.tsx');
