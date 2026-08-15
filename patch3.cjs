const fs = require('fs');
let code = fs.readFileSync('src/components/queues/LiveQueuesScreen.tsx', 'utf8');
code = code.replace(/<div\s+key={queue\.id}\s+onClick={\(\) => handleSelectQueue\(location\.id, queue\.id\)}\s+className="rounded-\[20px\].*?"\s+>/g, 
  `<motion.div
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      key={queue.id}
                      onClick={() => handleSelectQueue(location.id, queue.id)}
                      className="rounded-[20px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.15)] transition-all cursor-pointer overflow-hidden flex flex-col group bg-white border border-slate-100"
                    >`);
fs.writeFileSync('src/components/queues/LiveQueuesScreen.tsx', code);
