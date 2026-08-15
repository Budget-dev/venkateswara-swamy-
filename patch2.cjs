const fs = require('fs');
let code = fs.readFileSync('src/components/queues/LiveQueuesScreen.tsx', 'utf8');
code = code.replace("import React, { useState, useRef } from 'react';", "import React, { useState, useRef } from 'react';\nimport { motion, AnimatePresence } from 'motion/react';");
code = code.replace('<div className="flex flex-col gap-4">', '<div className="flex flex-col gap-4">');
code = code.replace(
  '{sortedQueues.map((queue) => {',
  '<AnimatePresence mode="popLayout">\n                {sortedQueues.map((queue) => {'
);

code = code.replace(
  'return (\n                    <div\n                      key={queue.id}\n                      className="group bg-white rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 transition-all hover:shadow-md cursor-pointer flex flex-col relative"\n                      onClick={() => {',
  'return (\n                    <motion.div\n                      layout\n                      initial={{ opacity: 0, y: 10, scale: 0.98 }}\n                      animate={{ opacity: 1, y: 0, scale: 1 }}\n                      exit={{ opacity: 0, scale: 0.98 }}\n                      transition={{ duration: 0.2 }}\n                      key={queue.id}\n                      className="group bg-white rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 transition-all hover:shadow-md cursor-pointer flex flex-col relative"\n                      onClick={() => {'
);
code = code.replace(
  '</div>\n                  );\n                })}\n              </div>',
  '</motion.div>\n                  );\n                })}\n                </AnimatePresence>\n              </div>'
);
fs.writeFileSync('src/components/queues/LiveQueuesScreen.tsx', code);
