'use client';

import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { FileUpload } from '@/components/FileUpload';
import { DomainTable, Domain } from '@/components/DomainTable';
import { Search, Download, Sparkles, AlertCircle, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import clsx from 'clsx';

// Helper to convert CVCV pattern to Regex
function convertPatternToRegex(pattern: string): RegExp | null {
  if (!pattern) return null;

  let regexStr = '^';
  const chars = pattern.toUpperCase().split('');

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const nextChar = chars[i + 1];
    const isStar = nextChar === '*';
    const quantifier = isStar ? '+' : '';

    if (isStar) i++; // Skip the star in next iteration

    switch (char) {
      case 'C': // Consonant
        regexStr += `[bcdfghjklmnpqrstvwxyz]${quantifier}`;
        break;
      case 'V': // Vowel
        regexStr += `[aeiou]${quantifier}`;
        break;
      case 'N': // Number
        regexStr += `[0-9]${quantifier}`;
        break;
      case 'L': // Letter
        regexStr += `[a-z]${quantifier}`;
        break;
      case '?': // Wildcard
        regexStr += `.${quantifier}`;
        break;
      case '-': // Literal hyphen
        regexStr += `\\-${quantifier}`; // Escaped for regex
        break;
      default:
        // Treat as literal character if not a special token
        regexStr += `[${char.toLowerCase()}]${quantifier}`;
        break;
    }
  }

  regexStr += '$';

  try {
    return new RegExp(regexStr, 'i');
  } catch (e) {
    return null;
  }
}

export default function Home() {
  const [allDomains, setAllDomains] = useState<Domain[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [tldFilter, setTldFilter] = useState('');
  const [minLen, setMinLen] = useState<number | ''>('');
  const [maxLen, setMaxLen] = useState<number | ''>('');

  // Advanced Filters - Allowlist
  const [startsWith, setStartsWith] = useState('');
  const [contains, setContains] = useState('');
  const [endsWith, setEndsWith] = useState('');

  // Advanced Filters - Patterns
  const [regexPattern, setRegexPattern] = useState('');
  const [patternFilter, setPatternFilter] = useState('');

  // Advanced Filters - Settings
  const [onlyNumbers, setOnlyNumbers] = useState(false);
  const [onlyCharacters, setOnlyCharacters] = useState(false);
  const [noHyphens, setNoHyphens] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [copied, setCopied] = useState(false);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tldFilter, minLen, maxLen, startsWith, contains, endsWith, regexPattern, patternFilter, onlyNumbers, onlyCharacters, noHyphens]);

  const handleFileUpload = (file: File) => {
    setIsParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Efficiently find a value in a row by matching against multiple potential header patterns
        const findValue = (row: any, ...targets: string[]) => {
          const keys = Object.keys(row);
          for (const target of targets) {
            const normalizedTarget = target.toLowerCase().trim();
            const key = keys.find(k => k.toLowerCase().trim() === normalizedTarget);
            if (key) return row[key];
          }
          return '';
        };

        const parsed: Domain[] = results.data.map((row: any) => {
          const domainName = findValue(row, 'Domain', 'domain', 'Domain Name');

          if (!domainName) return null;

          const parts = domainName.split('.');
          const tld = parts.length > 1 ? parts.pop() : '';
          const name = parts.join('.'); // Part before dot

          return {
            domainName: domainName,
            tld: tld || '',
            length: name.length,
            deleteDate: findValue(row, 'Join By Date (ET)', 'PreReleaseDate', 'delete_date', 'Date'),
          };
        }).filter((d: any): d is Domain => d !== null);

        setAllDomains(parsed);
        setLastUpdated(new Date().toLocaleTimeString());
        setIsParsing(false);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setIsParsing(false);
        alert('Failed to parse CSV file.');
      }
    });
  };

  const filteredDomains = useMemo(() => {
    const patternRegex = convertPatternToRegex(patternFilter);

    return allDomains.filter(d => {
      const namePart = d.domainName.split('.')[0].toLowerCase();

      // Search term
      if (searchTerm && !d.domainName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Regex Filter (Raw)
      if (regexPattern) {
        try {
          const regex = new RegExp(regexPattern, 'i');
          if (!regex.test(d.domainName)) return false;
        } catch (e) {
          // Ignore invalid regex
        }
      }

      // Pattern Filter (CVCV)
      if (patternRegex && !patternRegex.test(namePart)) {
        return false;
      }

      // TLD Filter
      if (tldFilter) {
        const cleanFilter = tldFilter.replace(/^\./, '').toLowerCase();
        if (d.tld.toLowerCase() !== cleanFilter) return false;
      }

      // Min Length
      if (minLen !== '' && d.length < Number(minLen)) return false;

      // Max Length
      if (maxLen !== '' && d.length > Number(maxLen)) return false;

      // Allowlist filters
      if (startsWith && !namePart.startsWith(startsWith.toLowerCase())) return false;
      if (contains && !namePart.includes(contains.toLowerCase())) return false;
      if (endsWith && !namePart.endsWith(endsWith.toLowerCase())) return false;

      // Settings filters
      if (noHyphens && namePart.includes('-')) return false;
      if (onlyNumbers && !/^\d+$/.test(namePart)) return false;
      if (onlyCharacters && !/^[a-z]+$/.test(namePart)) return false;

      return true;
    });
  }, [allDomains, searchTerm, regexPattern, patternFilter, tldFilter, minLen, maxLen, startsWith, contains, endsWith, onlyNumbers, onlyCharacters, noHyphens]);

  // Derived Pagination Data
  const paginatedDomains = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDomains.slice(start, start + itemsPerPage);
  }, [filteredDomains, currentPage, itemsPerPage]);

  const uniqueTLDs = useMemo(() => {
    const tlds = new Set(allDomains.map(d => d.tld).filter(Boolean));
    return Array.from(tlds).sort();
  }, [allDomains]);

  // Pagination State Helpers
  const totalItems = filteredDomains.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (totalItems === 0) ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min((currentPage - 1) * itemsPerPage + itemsPerPage, totalItems);


  const handleExport = () => {
    if (filteredDomains.length === 0) return;

    // Export ALL filtered domains, not just valid page
    const csv = Papa.unparse(filteredDomains);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `crush_domains_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    if (paginatedDomains.length === 0) return;
    const text = paginatedDomains.map(d => d.domainName).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-indigo-500" />
              Crush Domains
            </h1>
            <p className="text-lg text-slate-500 font-medium">Domain Investor Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/instant-appraisal"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Instant Appraisal
            </a>
            {lastUpdated && (
              <div className="px-4 py-2 bg-white/60 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-600 border border-indigo-100 shadow-sm">
                Data Updated: {lastUpdated}
              </div>
            )}
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">

          {/* Sidebar Filters */}
          <aside className="space-y-6">
            <div className="p-6 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 space-y-6 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar">

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Data Source</label>
                <FileUpload onFileSelect={handleFileUpload} />
                {isParsing && <p className="text-xs font-medium text-indigo-500 mt-2 animate-pulse">Parsing CSV...</p>}
              </div>

              <div className="h-px bg-slate-200/50" />

              {/* Filters Group */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Filters</h3>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{allDomains.length} total</span>
                </div>

                {/* Search */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Keyword Search</label>
                  <div className="relative group">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search domains..."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Pattern Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    Pattern
                    <div className="group relative">
                      <AlertCircle className="w-3 h-3 text-slate-400 cursor-help" />
                      <div className="absolute right-0 w-64 p-3 bg-slate-800 text-slate-100 text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 -top-2 translate-x-full">
                        <p className="font-bold mb-1">Pattern Guide:</p>
                        <p>C = Consonant</p>
                        <p>V = Vowel</p>
                        <p>N = Number</p>
                        <p>L = Letter</p>
                        <p>* = Repeating (e.g. N*)</p>
                        <p>Example: CVCV &rarr; Rare.com</p>
                      </div>
                    </div>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CVCV, NNN, L*-N*"
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm font-mono text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:font-sans uppercase"
                    value={patternFilter}
                    onChange={(e) => setPatternFilter(e.target.value)}
                  />
                  {patternFilter && (
                    <p className="text-[10px] text-slate-400">
                      Matches: <span className="font-mono text-indigo-500">{convertPatternToRegex(patternFilter)?.source || 'Invalid'}</span>
                    </p>
                  )}
                </div>

                {/* Regex */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    Regex
                    <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 rounded">Expert</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ^[0-9]{3}\.com$"
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm font-mono text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:font-sans"
                    value={regexPattern}
                    onChange={(e) => setRegexPattern(e.target.value)}
                  />
                </div>

                {/* TLD */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Extension</label>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none cursor-pointer"
                      value={tldFilter}
                      onChange={(e) => setTldFilter(e.target.value)}
                    >
                      <option value="">All Extensions</option>
                      {uniqueTLDs.map(tld => (
                        <option key={tld} value={tld}>.{tld}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                {/* Length Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Min Len</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      value={minLen}
                      onChange={(e) => setMinLen(e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Max Len</label>
                    <input
                      type="number"
                      placeholder="∞"
                      className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      value={maxLen}
                      onChange={(e) => setMaxLen(e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>
                </div>

                {/* Advanced: Allowlist */}
                <div className="space-y-3 pt-3 border-t border-slate-200/50">
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    Allowlist
                  </h4>
                  <div className="space-y-2">
                    {['Starts with', 'Contains', 'Ends with'].map((placeholder, idx) => {
                      const val = idx === 0 ? startsWith : idx === 1 ? contains : endsWith;
                      const setVal = idx === 0 ? setStartsWith : idx === 1 ? setContains : setEndsWith;
                      return (
                        <input
                          key={placeholder}
                          type="text"
                          placeholder={placeholder}
                          className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                          value={val}
                          onChange={(e) => setVal(e.target.value)}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Advanced: Settings */}
                <div className="space-y-3 pt-3 border-t border-slate-200/50">
                  <h4 className="text-sm font-semibold text-slate-800">Settings</h4>
                  <div className="space-y-2.5">
                    {[
                      { l: 'Only Numbers', s: onlyNumbers, set: (c: boolean) => { setOnlyNumbers(c); if (c) setOnlyCharacters(false); } },
                      { l: 'Only Characters', s: onlyCharacters, set: (c: boolean) => { setOnlyCharacters(c); if (c) setOnlyNumbers(false); } },
                      { l: 'No Hyphens', s: noHyphens, set: setNoHyphens }
                    ].map((opt) => (
                      <label key={opt.l} className="flex items-center gap-3 text-sm text-slate-600 cursor-pointer group hover:text-indigo-600 transition-colors">
                        <div className={clsx("w-5 h-5 rounded border flex items-center justify-center transition-all", opt.s ? "bg-indigo-500 border-indigo-500" : "bg-white border-slate-300 group-hover:border-indigo-400")}>
                          {opt.s && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={opt.s}
                          onChange={(e) => opt.set(e.target.checked)}
                        />
                        {opt.l}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden flex flex-col h-full min-h-[800px]">

              {/* Results Header with Pagination & Actions */}
              <div className="p-4 border-b border-slate-100 md:flex flex-wrap justify-between items-center bg-white/50 gap-4">

                {/* Left: Title & Count */}
                <div className="flex items-baseline gap-2 min-w-max">
                  <h2 className="text-lg font-bold text-slate-800">Results</h2>
                  <span className="text-sm font-medium text-slate-400">({filteredDomains.length})</span>
                </div>

                {/* Right: Controls */}
                <div className="flex flex-wrap items-center gap-3 md:gap-4 flex-1 justify-end">

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-3 bg-slate-50/80 px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-sm">
                    <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 border-r border-slate-200 pr-3">
                      <span>Rows:</span>
                      <select
                        className="bg-transparent font-medium focus:ring-0 outline-none cursor-pointer"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        {[25, 50, 100, 200].map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 hidden sm:inline whitespace-nowrap">
                        {startItem}-{endItem} of {totalItems}
                      </span>

                      <div className="flex items-center gap-1 pl-1">
                        <button
                          onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                          disabled={currentPage === 1}
                          className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none transition-all text-slate-600"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="text-xs font-semibold text-slate-700 min-w-[16px] text-center">{currentPage}</span>
                        <button
                          onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                          disabled={currentPage === totalPages || totalPages === 0}
                          className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none transition-all text-slate-600"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="h-6 w-px bg-slate-200 hidden md:block" />

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      disabled={paginatedDomains.length === 0}
                      className={clsx(
                        "flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95 border",
                        copied
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-slate-100"
                      )}
                      title="Copy visible domains to clipboard"
                    >
                      <Copy size={16} />
                      {copied ? 'Copied' : 'Copy'}
                    </button>

                    <button
                      onClick={handleExport}
                      disabled={filteredDomains.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-sm shadow-indigo-200 transition-all active:scale-95"
                    >
                      <Download size={16} />
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-visible">
                <DomainTable domains={paginatedDomains} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
