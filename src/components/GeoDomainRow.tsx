"use client";

import React from 'react';
import { ExternalLink, Droplets, BarChart3, Users, Archive } from 'lucide-react';

export type GeoDomain = {
    domain: string;
    keyword?: string;
    city?: string;
    country?: string;
    mainKeyword?: string;
    score: number;
    style?: string;
    population?: number;
    state?: string;
    locId?: number;
};

interface VolumeButtonProps {
    keyword: string;
    locId: number;
}

const VolumeButton = ({ keyword, locId }: VolumeButtonProps) => {
    const handleVolumeClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const encodedKeyword = encodeURIComponent(keyword);
        const url = `https://app.neilpatel.com/en/ai-keyword-overview?lang=en&locId=${locId}&keyword=${encodedKeyword}`;
        window.open(url, "_blank");
    };

    return (
        <button
            onClick={handleVolumeClick}
            className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
        >
            <BarChart3 className="w-3 h-3" /> Volume
        </button>
    );
};

interface AppraisalButtonProps {
    domain: string;
}

const AppraisalButton = ({ domain }: AppraisalButtonProps) => {
    const handleAppraisalClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const encodedDomain = encodeURIComponent(domain);
        const url = `/instant-appraisal?domain=${encodedDomain}`;
        window.open(url, "_blank");
    };

    return (
        <button
            onClick={handleAppraisalClick}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-sky-600 transition-colors"
        >
            <Droplets className="w-3 h-3" /> Appraisal
        </button>
    );
};

interface GeoDomainRowProps {
    item: GeoDomain;
    status?: { available: boolean } | null;
}

export function GeoDomainRow({ item, status }: GeoDomainRowProps) {
    const { domain, keyword, city, country, mainKeyword, locId } = item;

    // Use mainKeyword if available, otherwise fallback to keyword
    const effectiveKeyword = mainKeyword || keyword || '';

    // Specific search for Google Maps: "<City> <MainKeyword> <Country>"
    const mapsQueryParts = [city, effectiveKeyword, country].filter(Boolean);
    const mapsQuery = mapsQueryParts.join(' ');
    const encodedMapsQuery = encodeURIComponent(mapsQuery);

    // Ubersuggest Logic
    // keyword = combinaison dynamique de la ville + du service (ex: "New York Dental")
    // localisation%20Keyword -> ${city} ${effectiveKeyword}
    const ubersuggestKeyword = (city && effectiveKeyword) ? `${city} ${effectiveKeyword}` : (city || effectiveKeyword || '');
    const effectiveLocId = locId || 2840; // Default to US if not provided

    // URLs
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedMapsQuery}`;
    const archiveUrl = `https://web.archive.org/web/*/https://${domain}/`;

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 60) return 'text-indigo-500';
        if (score >= 40) return 'text-amber-500';
        return 'text-rose-500';
    };

    const buyUrl = status?.available
        ? `https://www.dynadot.com/domain/search?domain=${domain}&aff=CRUSHDOMAINS&utm_source=crushdomains&utm_campaign=dynadot-ambassador`
        : '#';

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 transition-all hover:shadow-md group gap-4">
            <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-xl font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors font-mono truncate">
                        {domain}
                    </span>
                    <div className="shrink-0">
                        {status === undefined ? (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold border border-slate-100 animate-pulse">Checking...</span>
                        ) : status === null ? (
                            <span className="text-rose-400 text-[10px] font-bold">Error</span>
                        ) : status.available ? (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">🟢 Available</span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold border border-slate-100">🔴 Taken</span>
                        )}
                    </div>
                </div>

                {/* Geo Details */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.style}</span>
                    {city && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-bold border border-indigo-100">
                            📍 {city}{item.state ? `, ${item.state}` : ''}
                        </span>
                    )}
                    {item.population && (
                        <span className="text-[9px] font-bold text-slate-500">👥 {item.population.toLocaleString()}</span>
                    )}
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-wrap gap-2 mt-3">
                    <AppraisalButton domain={domain} />

                    <VolumeButton keyword={ubersuggestKeyword} locId={effectiveLocId} />

                    <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-purple-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-purple-600 transition-colors"
                    >
                        <Users className="w-3 h-3" /> Clients (Google Maps)
                    </a>
                    <a
                        href={archiveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-300 transition-colors"
                    >
                        <Archive className="w-3 h-3" /> Archive
                    </a>
                </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end gap-6 md:gap-2 shrink-0">
                <div className="flex flex-col items-center md:items-end">
                    <span className={`text-2xl font-bold leading-none ${getScoreColor(item.score)}`}>{item.score}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Score</span>
                </div>

                <a
                    href={buyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-200 transition-all hover:scale-105 active:scale-95 group/btn ${status?.available ? '' : 'opacity-50 pointer-events-none'}`}
                >
                    Buy @ Dynadot
                    <ExternalLink className="w-3.5 h-3.5 text-white/90" />
                </a>
            </div>
        </div>
    );
}
