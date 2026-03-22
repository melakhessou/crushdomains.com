const fs = require('fs');
const path = require('path');

const map = {
  'bg-white/80': 'dark:bg-slate-950/80',
  'bg-white/60': 'dark:bg-slate-950/60',
  'bg-white/50': 'dark:bg-slate-950/50',
  'bg-white': 'dark:bg-slate-950',
  'bg-slate-50': 'dark:bg-slate-900',
  'bg-slate-50/30': 'dark:bg-slate-900/30',
  'bg-slate-50/50': 'dark:bg-slate-900/50',
  'bg-slate-50/80': 'dark:bg-slate-900/80',
  'bg-slate-100': 'dark:bg-slate-800/80',
  'bg-slate-100/50': 'dark:bg-slate-800/50',
  'bg-slate-200': 'dark:bg-slate-800',
  'text-slate-900': 'dark:text-slate-50',
  'text-slate-800': 'dark:text-slate-200',
  'text-slate-700': 'dark:text-slate-300',
  'text-slate-600': 'dark:text-slate-400',
  'text-slate-500': 'dark:text-slate-400',
  'text-slate-400': 'dark:text-slate-500',
  'border-slate-50': 'dark:border-slate-800',
  'border-slate-100': 'dark:border-slate-800/60',
  'border-slate-200': 'dark:border-slate-700',
  'border-white/50': 'dark:border-slate-800/50',
  'border-white': 'dark:border-slate-800',
  'from-indigo-50': 'dark:from-slate-950',
  'via-slate-50': 'dark:via-slate-900',
  'to-indigo-100': 'dark:to-indigo-950/20',
  'bg-indigo-50': 'dark:bg-indigo-900/20',
  'bg-indigo-100': 'dark:bg-indigo-900/40',
};

function processFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  let newContent = content;
  for (const [light, dark] of Object.entries(map)) {
    const regex = new RegExp(`(["'\\\`\\s])(${light.replace(/[/\-\\]/g, '\\$&')})(?=["'\\\`\\s])`, 'g');
    newContent = newContent.replace(regex, (match, prefix, cls) => {
        // avoid duplicating if the dark class is already present later
        return prefix + cls + ' ' + dark;
    });
  }
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
}

const files = [
  'src/components/ExpiredDomainsDashboard.tsx',
  'src/components/DomainTable.tsx',
  'src/components/BuyDomainButton.tsx',
  'src/components/CheckboxCaptcha.tsx',
  'src/components/GeoDomainRow.tsx',
  'src/components/DynadotFilters.tsx',
  'src/components/ResultsTable.tsx',
  'src/components/ui/Tooltip.tsx',
  'src/components/ui/page-title.tsx',
  'src/components/FileUpload.tsx',
  'src/app/page.tsx',
  'src/app/generator/page.tsx',
  'src/app/filter/page.tsx',
  'src/app/instant-appraisal/page.tsx',
  'src/app/domain-search/page.tsx',
  'src/app/auctions/page.tsx',
  'src/app/bulk-appraisal/page.tsx',
].map(f => path.join(__dirname, '..', f));

files.forEach(processFile);
