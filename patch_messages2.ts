import fs from 'fs';

const file = 'src/components/Messages.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const newCode = `          <button 
            type="button"
            onClick={() => setShowNewMessageModal(true)}
            className="fixed bottom-24 left-5 w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all z-20 cursor-pointer overflow-hidden p-0 border-none"
            title="Tulis pesan baru"
          >
            <img 
              src="/chat_logo.png" 
              alt="Chat" 
              className="w-full h-full object-contain scale-110" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                }
              }} 
            />
            <div style={{ display: 'none' }} className="items-center justify-center w-full h-full">
              <SquarePen size={28} />
            </div>
          </button>`;

lines.splice(650, 20, newCode);

fs.writeFileSync(file, lines.join('\n'));
console.log("Patched correctly");
