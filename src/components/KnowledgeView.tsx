/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  BookOpen, 
  Layers, 
  FileCheck, 
  AlertCircle, 
  XOctagon, 
  Hash, 
  Link2,
  FileText,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Eye,
  Share2,
  Download,
  Terminal,
  Compass,
  CornerDownRight,
  Info
} from 'lucide-react';
import { KnowledgePipeline, KnowledgeDoc } from '../types';
import { MOCK_KNOWLEDGE_DOCS } from '../mockData';

interface KnowledgeViewProps {
  knowledge: KnowledgePipeline;
}

export default function KnowledgeView({ knowledge }: KnowledgeViewProps) {
  // 문서 리스트 상태 관리
  const [docs, setDocs] = useState<KnowledgeDoc[]>(MOCK_KNOWLEDGE_DOCS);
  const [selectedDocId, setSelectedDocId] = useState<string>('doc_001');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    root: true,
    inbox: true,
    sources: true,
    research: true,
    atomic: true
  });
  const [activeFolderFilter, setActiveFolderFilter] = useState<string>('all');

  const selectedDoc = docs.find(d => d.id === selectedDocId) || docs[0];

  // 폴더 확장/축소 토글
  const toggleFolder = (folderKey: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderKey]: !prev[folderKey]
    }));
  };

  // 마크다운 초간단 뷰어 파서 함수 (JSX 변환)
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // 1. 헤더 처리
      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-lg font-bold text-white border-b border-gray-800 pb-2 mt-4 mb-3 font-sans tracking-tight">
            {trimmed.slice(2)}
          </h1>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-sm font-semibold text-indigo-400 mt-4 mb-2 flex items-center gap-1.5 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            {trimmed.slice(3)}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-xs font-semibold text-cyan-300 mt-3 mb-1 font-sans">
            {trimmed.slice(4)}
          </h3>
        );
      }

      // 2. 인용구 처리
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-2 border-indigo-500 bg-indigo-950/20 px-3 py-2 my-2 rounded-r-lg text-[11px] text-indigo-200 italic font-mono leading-relaxed">
            {trimmed.slice(2)}
          </blockquote>
        );
      }

      // 3. 코드 블록 시작/종료 또는 백틱 감싸진 부분
      if (trimmed.startsWith('```')) {
        return null; // 간단 변환을 위해 코드 블록 마커는 생략
      }
      if (line.includes('`')) {
        // 백틱 인라인 코드 처리
        const parts = line.split('`');
        return (
          <p key={idx} className="text-[11px] text-gray-300 leading-relaxed font-mono my-1">
            {parts.map((part, pIdx) => pIdx % 2 === 1 ? (
              <code key={pIdx} className="bg-gray-950 px-1.5 py-0.5 rounded text-indigo-400 border border-gray-800 font-bold">{part}</code>
            ) : part)}
          </p>
        );
      }

      // 4. 리스트 아이템
      if (trimmed.startsWith('* ')) {
        const itemText = trimmed.slice(2);
        
        // 위키링크 파싱 [[Link]]
        const wikiLinkRegex = /\[\[(.*?)\]\]/g;
        if (wikiLinkRegex.test(itemText)) {
          const parts = itemText.split(wikiLinkRegex);
          return (
            <li key={idx} className="list-disc list-inside text-[11px] text-gray-300 ml-2 my-1 leading-relaxed">
              {parts.map((part, pIdx) => {
                if (pIdx % 2 === 1) {
                  // 해당 링크를 가진 문서 검색
                  const linkedDoc = docs.find(d => d.name.toLowerCase().startsWith(part.toLowerCase()));
                  return (
                    <button 
                      key={pIdx}
                      onClick={() => linkedDoc && setSelectedDocId(linkedDoc.id)}
                      className={`px-1.5 py-0.2 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-900/80 rounded font-bold text-[10px] text-indigo-300 transition-colors cursor-pointer mx-0.5 inline-flex items-center gap-0.5 ${linkedDoc ? '' : 'opacity-60 border-dashed bg-transparent text-gray-400'}`}
                    >
                      <Link2 className="w-3 h-3 text-indigo-400" />
                      [[{part}]]
                    </button>
                  );
                }
                return part;
              })}
            </li>
          );
        }

        return (
          <li key={idx} className="list-disc list-inside text-[11px] text-gray-300 ml-2 my-1 leading-relaxed">
            {itemText}
          </li>
        );
      }

      // 5. 일반 텍스트 라인 내 Wiki 링크 파싱
      const wikiLinkRegex = /\[\[(.*?)\]\]/g;
      if (wikiLinkRegex.test(trimmed)) {
        const parts = trimmed.split(wikiLinkRegex);
        return (
          <p key={idx} className="text-[11px] text-gray-300 leading-relaxed my-1.5">
            {parts.map((part, pIdx) => {
              if (pIdx % 2 === 1) {
                const linkedDoc = docs.find(d => d.name.toLowerCase().startsWith(part.toLowerCase()));
                return (
                  <button 
                    key={pIdx}
                    onClick={() => linkedDoc && setSelectedDocId(linkedDoc.id)}
                    className="px-1.5 py-0.2 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-900/80 rounded font-bold text-[10px] text-indigo-300 transition-colors cursor-pointer inline-flex items-center gap-0.5"
                  >
                    <Link2 className="w-3 h-3 text-indigo-400" />
                    [[{part}]]
                  </button>
                );
              }
              return part;
            })}
          </p>
        );
      }

      // 6. 공백 처리
      if (trimmed === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-[11px] text-gray-300 leading-relaxed my-1.5">
          {line}
        </p>
      );
    });
  };

  // 선택된 문서의 연결 노드 추출
  const getLinkedNodes = (doc: KnowledgeDoc) => {
    // 마크다운 내에서 [[Link]] 들을 정규식으로 수집
    const regex = /\[\[(.*?)\]\]/g;
    const links: string[] = [];
    let match;
    while ((match = regex.exec(doc.content)) !== null) {
      links.push(match[1]);
    }
    return links;
  };

  const currentLinks = getLinkedNodes(selectedDoc);

  // 분류 폴더별 파일 필터링
  const getFilteredDocs = () => {
    if (activeFolderFilter === 'all') return docs;
    return docs.filter(d => d.category === activeFolderFilter);
  };

  const filteredDocs = getFilteredDocs();

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner & Dynamic Integration Summary */}
      <div className="bg-gray-900/60 p-6 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            지식 영구 보관소 (Atomic Vault Viewer)
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            수집된 실시간 리서치 데이터와 뉴스레터 원본이 어떤 가공 절차를 거쳐 Obsidian Vault 최하단까지 연관 관계로 분류 저장되는지 구조를 투명하게 시각화합니다.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-300 font-mono bg-gray-950/60 border border-gray-800 px-3.5 py-2 rounded-xl">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Obsidian Vault: 5 Active Nodes</span>
        </div>
      </div>

      {/* 2. Optimized Core Stats Panel (누적 통계 최소화 및 압축) */}
      <div className="bg-gray-950/40 border border-gray-900 rounded-2xl p-4">
        <div className="flex items-center justify-between border-b border-gray-900/60 pb-2 mb-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            지식 정제 파이프라인 누적 통계 (요약)
          </span>
          <span className="text-[9px] font-mono text-gray-500">Auto Sync Active</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Stat 1: Newsletter */}
          <div className="bg-gray-900/20 border border-gray-800/60 p-2.5 rounded-xl flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Folder className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[9px] text-gray-500 block">수집 뉴스레터</span>
              <span className="text-xs font-bold text-blue-300 font-mono">{knowledge.newsletterCollected}건</span>
            </div>
          </div>

          {/* Stat 2: Source Saved */}
          <div className="bg-gray-900/20 border border-gray-800/60 p-2.5 rounded-xl flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[9px] text-gray-500 block">백업 소스</span>
              <span className="text-xs font-bold text-cyan-300 font-mono">{knowledge.sourceSaved}건</span>
            </div>
          </div>

          {/* Stat 3: Report Created */}
          <div className="bg-gray-900/20 border border-gray-800/60 p-2.5 rounded-xl flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[9px] text-gray-500 block">분석 보고서</span>
              <span className="text-xs font-bold text-purple-300 font-mono">{knowledge.reportCreated}건</span>
            </div>
          </div>

          {/* Stat 4: Atomic Notes */}
          <div className="bg-gray-900/20 border border-gray-800/60 p-2.5 rounded-xl flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[9px] text-gray-500 block">원자 노드 영구화</span>
              <span className="text-xs font-bold text-emerald-300 font-mono">{knowledge.atomicNoteCreated}건</span>
            </div>
          </div>

          {/* Stat 5: Today Saved */}
          <div className="bg-gray-900/20 border border-gray-800/60 p-2.5 rounded-xl flex items-center gap-2 col-span-2 md:col-span-1">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[9px] text-gray-500 block">오늘의 보관 처리</span>
              <span className="text-xs font-bold text-amber-300 font-mono">{knowledge.obsidianSavedToday}개</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Splitted View: Vault Directory Structure Map VS Markdown Live Previewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Part (5 Cols): Storage Architecture & File Directory Tree */}
        <div className="lg:col-span-5 bg-gray-950/40 border border-gray-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-900 pb-2">
              <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-400" />
                Vault 아키텍처 분류 맵 (Directory Tree)
              </span>
              <button 
                onClick={() => setActiveFolderFilter('all')}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                  activeFolderFilter === 'all' 
                    ? 'bg-indigo-950/40 text-indigo-300 border-indigo-900/80' 
                    : 'bg-gray-900/20 text-gray-500 border-gray-800/60 hover:text-gray-300'
                }`}
              >
                전체보기
              </button>
            </div>

            {/* Folder Trees (Mock Vault Structure) */}
            <div className="space-y-1.5 font-mono text-[11px] text-gray-400 pl-1">
              
              {/* Root Directory */}
              <div className="flex items-center gap-1 text-gray-300 font-semibold cursor-pointer" onClick={() => toggleFolder('root')}>
                {expandedFolders.root ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <Database className="w-3.5 h-3.5 text-gray-400" />
                <span>Obsidian_Vault_Hermes/</span>
              </div>

              {expandedFolders.root && (
                <div className="pl-4 space-y-2 pt-1">
                  
                  {/* Category 1: Inbox */}
                  <div className="space-y-1">
                    <div 
                      onClick={() => { toggleFolder('inbox'); setActiveFolderFilter('newsletter'); }}
                      className={`flex items-center justify-between hover:text-white p-1 rounded transition-colors cursor-pointer ${activeFolderFilter === 'newsletter' ? 'bg-indigo-950/20 text-indigo-300' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        {expandedFolders.inbox ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        {expandedFolders.inbox ? <FolderOpen className="w-3.5 h-3.5 text-blue-400" /> : <Folder className="w-3.5 h-3.5 text-blue-400" />}
                        <span>Inbox/</span>
                        <span className="text-[9px] text-gray-600 font-normal">(수집 원본)</span>
                      </div>
                      <span className="text-[9px] font-mono text-gray-600 font-semibold bg-gray-900 px-1 py-0.1 rounded">1</span>
                    </div>
                    {expandedFolders.inbox && (
                      <div className="pl-6 space-y-1">
                        {docs.filter(d => d.category === 'newsletter').map(d => (
                          <div 
                            key={d.id} 
                            onClick={() => setSelectedDocId(d.id)}
                            className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors hover:bg-gray-900/60 ${selectedDocId === d.id ? 'text-indigo-300 font-bold bg-indigo-950/30' : 'text-gray-500'}`}
                          >
                            <CornerDownRight className="w-3 h-3 text-gray-700" />
                            <FileText className="w-3 h-3 text-blue-400/80" />
                            <span className="truncate max-w-[180px]">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category 2: Sources */}
                  <div className="space-y-1">
                    <div 
                      onClick={() => { toggleFolder('sources'); setActiveFolderFilter('source'); }}
                      className={`flex items-center justify-between hover:text-white p-1 rounded transition-colors cursor-pointer ${activeFolderFilter === 'source' ? 'bg-indigo-950/20 text-indigo-300' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        {expandedFolders.sources ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        {expandedFolders.sources ? <FolderOpen className="w-3.5 h-3.5 text-cyan-400" /> : <Folder className="w-3.5 h-3.5 text-cyan-400" />}
                        <span>Sources/</span>
                        <span className="text-[9px] text-gray-600 font-normal">(백업 소스)</span>
                      </div>
                      <span className="text-[9px] font-mono text-gray-600 font-semibold bg-gray-900 px-1 py-0.1 rounded">1</span>
                    </div>
                    {expandedFolders.sources && (
                      <div className="pl-6 space-y-1">
                        {docs.filter(d => d.category === 'source').map(d => (
                          <div 
                            key={d.id} 
                            onClick={() => setSelectedDocId(d.id)}
                            className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors hover:bg-gray-900/60 ${selectedDocId === d.id ? 'text-indigo-300 font-bold bg-indigo-950/30' : 'text-gray-500'}`}
                          >
                            <CornerDownRight className="w-3 h-3 text-gray-700" />
                            <FileText className="w-3 h-3 text-cyan-400/80" />
                            <span className="truncate max-w-[180px]">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category 3: Research / Reports */}
                  <div className="space-y-1">
                    <div 
                      onClick={() => { toggleFolder('research'); setActiveFolderFilter('report'); }}
                      className={`flex items-center justify-between hover:text-white p-1 rounded transition-colors cursor-pointer ${activeFolderFilter === 'report' ? 'bg-indigo-950/20 text-indigo-300' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        {expandedFolders.research ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        {expandedFolders.research ? <FolderOpen className="w-3.5 h-3.5 text-purple-400" /> : <Folder className="w-3.5 h-3.5 text-purple-400" />}
                        <span>Research/</span>
                        <span className="text-[9px] text-gray-600 font-normal">(분석 리포트)</span>
                      </div>
                      <span className="text-[9px] font-mono text-gray-600 font-semibold bg-gray-900 px-1 py-0.1 rounded">1</span>
                    </div>
                    {expandedFolders.research && (
                      <div className="pl-6 space-y-1">
                        {docs.filter(d => d.category === 'report').map(d => (
                          <div 
                            key={d.id} 
                            onClick={() => setSelectedDocId(d.id)}
                            className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors hover:bg-gray-900/60 ${selectedDocId === d.id ? 'text-indigo-300 font-bold bg-indigo-950/30' : 'text-gray-500'}`}
                          >
                            <CornerDownRight className="w-3 h-3 text-gray-700" />
                            <FileText className="w-3 h-3 text-purple-400/80" />
                            <span className="truncate max-w-[180px]">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category 4: Vault/Atomic/ */}
                  <div className="space-y-1">
                    <div 
                      onClick={() => { toggleFolder('atomic'); setActiveFolderFilter('atomic'); }}
                      className={`flex items-center justify-between hover:text-white p-1 rounded transition-colors cursor-pointer ${activeFolderFilter === 'atomic' ? 'bg-indigo-950/20 text-indigo-300' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        {expandedFolders.atomic ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        {expandedFolders.atomic ? <FolderOpen className="w-3.5 h-3.5 text-emerald-400" /> : <Folder className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>Vault/Atomic/</span>
                        <span className="text-[9px] text-gray-600 font-normal">(영구 노드)</span>
                      </div>
                      <span className="text-[9px] font-mono text-gray-600 font-semibold bg-gray-900 px-1 py-0.1 rounded">2</span>
                    </div>
                    {expandedFolders.atomic && (
                      <div className="pl-6 space-y-1">
                        {docs.filter(d => d.category === 'atomic').map(d => (
                          <div 
                            key={d.id} 
                            onClick={() => setSelectedDocId(d.id)}
                            className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors hover:bg-gray-900/60 ${selectedDocId === d.id ? 'text-indigo-300 font-bold bg-indigo-950/30' : 'text-gray-500'}`}
                          >
                            <CornerDownRight className="w-3 h-3 text-gray-700" />
                            <FileText className="w-3 h-3 text-emerald-400/80" />
                            <span className="truncate max-w-[180px]">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          </div>

          {/* Dynamic Link Graph Summary */}
          <div className="bg-gray-900/30 border border-gray-900/80 p-4 rounded-xl space-y-2 mt-4 font-mono text-[10px]">
            <div className="text-gray-400 font-semibold uppercase flex items-center gap-1 pb-1 border-b border-gray-900">
              <Link2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>현재 노드의 양방향 링크 맵 구조</span>
            </div>
            <div className="space-y-1 text-gray-500">
              <div><span className="text-white">Active Document</span>: {selectedDoc.name}</div>
              <div><span className="text-white">Path</span>: {selectedDoc.path}</div>
              <div>
                <span className="text-white">Outgoing Connections ({currentLinks.length})</span>:
                {currentLinks.length === 0 ? (
                  <span className="text-gray-600 italic ml-1">없음</span>
                ) : (
                  <div className="flex flex-wrap gap-1 mt-1 pl-1">
                    {currentLinks.map(link => (
                      <span key={link} className="px-1.5 py-0.5 bg-indigo-950/40 border border-indigo-900 text-indigo-300 rounded font-semibold text-[9px]">
                        [[{link}]]
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Part (7 Cols): Custom Markdown Live Previewer */}
        <div className="lg:col-span-7 flex flex-col bg-gray-950/60 border border-gray-800 rounded-2xl shadow-xl overflow-hidden min-h-[550px]">
          
          {/* Preview Panel Title Bar */}
          <div className="bg-gray-900/60 border-b border-gray-800 px-5 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-indigo-400" />
              <div>
                <span className="text-xs font-bold text-gray-200 block font-mono">{selectedDoc.name}</span>
                <span className="text-[9px] text-gray-500 block font-mono">{selectedDoc.path}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500 font-mono bg-gray-950 border border-gray-900 px-2 py-0.5 rounded">
                {selectedDoc.size}
              </span>
              <span className="text-[10px] text-indigo-400 font-mono bg-indigo-950/30 border border-indigo-950 px-2 py-0.5 rounded">
                {selectedDoc.date}
              </span>
            </div>
          </div>

          {/* Preview Panel Body */}
          <div className="p-6 flex-1 overflow-y-auto space-y-4 max-h-[480px]">
            {/* Tags Ribbon */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2 pb-3 border-b border-gray-900/40">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">해시태그:</span>
              {selectedDoc.tags.map(tag => (
                <span 
                  key={tag} 
                  className="px-2 py-0.5 bg-gray-900 border border-gray-800 text-[10px] font-mono text-indigo-300 rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Custom Markdown Parser Output Container */}
            <div className="markdown-body space-y-3 font-mono text-gray-200 selection:bg-indigo-500/30 leading-relaxed text-xs">
              {renderMarkdown(selectedDoc.content)}
            </div>
          </div>

          {/* Action Footer (Mock Export options) */}
          <div className="bg-gray-950 border-t border-gray-900 px-5 py-3 flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-gray-600" />
              <span>Vault 저장 위치: Local Client Workspace</span>
            </span>
            <div className="flex items-center gap-3">
              <button className="hover:text-white transition-colors cursor-pointer flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5" />
                공유하기
              </button>
              <button className="hover:text-white transition-colors cursor-pointer flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                내보내기 (.md)
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
