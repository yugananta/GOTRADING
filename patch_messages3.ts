import fs from 'fs';

const file = 'src/components/Messages.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const oldCodeStart = lines.findIndex(l => l.includes('title="Tulis pesan baru"'));
if (oldCodeStart !== -1) {
  // Replace the button block
  const newCode = `            className="fixed bottom-24 left-5 w-16 h-16 sm:w-20 sm:h-20 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all z-20 cursor-pointer overflow-hidden p-0 border border-slate-200"
            title="Tulis pesan baru"
          >
            <img 
              src="/gotrading_logo.png?v=${Date.now()}" 
              alt="Chat" 
              className="w-full h-full object-contain p-2" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                }
              }} 
            />
            <div style={{ display: 'none' }} className="items-center justify-center w-full h-full bg-indigo-600 text-white">
              <SquarePen size={28} />
            </div>
          </button>`;

  lines.splice(oldCodeStart - 4, 20, newCode);
  fs.writeFileSync(file, lines.join('\n'));
  console.log("Patched successfully");
} else {
  console.log("Failed to find button");
}
