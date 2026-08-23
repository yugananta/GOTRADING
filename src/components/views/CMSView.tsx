import React from 'react';
import { FileText, Plus, Edit2, Eye } from 'lucide-react';
import { CMSContentItem } from '../../types';
import { Badge } from '../ui/Badge';

interface CMSViewProps {
  contentItems: CMSContentItem[];
}

export const CMSView: React.FC<CMSViewProps> = ({ contentItems }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" /> Content Management System (CMS)
          </h2>
          <p className="text-xs text-slate-400">Update website banners, homepage hero headlines, announcements, and FAQs without coding</p>
        </div>

        <button className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-colors">
          <Plus className="w-4 h-4" /> Add CMS Banner / Announcement
        </button>
      </div>

      <div className="space-y-3">
        {contentItems.map(item => (
          <div key={item.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="info">{item.section}</Badge>
                <span className="font-bold text-white text-xs">{item.title}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{item.content}</p>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">Updated: {item.updatedAt}</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={item.isActive ? 'success' : 'neutral'}>
                {item.isActive ? 'PUBLISHED' : 'DRAFT'}
              </Badge>
              <button className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
