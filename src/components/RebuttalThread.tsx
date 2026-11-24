'use client';

import { useState } from 'react';
import { MessageSquare, CornerDownRight, Send, ShieldCheck, User } from 'lucide-react';
import { RebuttalComment } from '@/types/database';
import { useAcademic } from '@/lib/store';

interface RebuttalThreadProps {
  paperId: string;
}

export function RebuttalThread({ paperId }: RebuttalThreadProps) {
  const { getThreadedRebuttalsForPaper, addRebuttalComment, currentUser } = useAcademic();
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const comments = getThreadedRebuttalsForPaper(paperId);

  const handlePost = async (parentId: string | null) => {
    if (!replyBody.trim()) return;
    setIsSubmitting(true);
    try {
      await addRebuttalComment({
        paper_id: paperId,
        body: replyBody.trim(),
        parent_comment_id: parentId,
      });
      setReplyBody('');
      setReplyToId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = (comment: RebuttalComment) => {
    const isReplying = replyToId === comment.comment_id;
    const depth = comment.depth || 0;
    const isAuthor = comment.user_role === 'AUTHOR';
    const isReviewer = comment.user_role === 'REVIEWER';
    const isChair = comment.user_role === 'CHAIR';

    return (
      <div
        key={comment.comment_id}
        style={{ marginLeft: `${Math.min(depth * 24, 72)}px` }}
        className={`relative mt-3 group transition-all`}
      >
        {/* Thread connector line */}
        {depth > 0 && (
          <div className="absolute -left-4 top-3.5 w-3.5 h-px bg-slate-200" />
        )}

        <div className="p-3.5 bg-white rounded-lg border border-[#E2E8F0] shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isAuthor
                    ? 'bg-blue-100 text-blue-800'
                    : isReviewer
                    ? 'bg-indigo-100 text-indigo-800'
                    : isChair
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {isAuthor ? 'A' : isReviewer ? 'R' : isChair ? 'C' : 'U'}
              </div>
              <span className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                {comment.display_name}
                {isAuthor && (
                  <span className="badge-double-blind text-[9px] px-1.5 py-0.2 rounded font-mono">
                    Blind Author
                  </span>
                )}
                {isReviewer && (
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] px-1.5 py-0.2 rounded font-mono">
                    Referee
                  </span>
                )}
                {isChair && (
                  <span className="badge-pending text-[9px] px-1.5 py-0.2 rounded font-mono">
                    Chair
                  </span>
                )}
              </span>
            </div>

            <span className="text-[10px] font-mono text-[#94A3B8]">
              {new Date(comment.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <p className="text-xs text-[#334155] leading-relaxed whitespace-pre-wrap font-sans">
            {comment.body}
          </p>

          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[10px] text-[#94A3B8] font-mono">
              Depth: {depth} • Tree Node
            </span>
            <button
              onClick={() => {
                setReplyToId(isReplying ? null : comment.comment_id);
                setReplyBody('');
              }}
              className="text-[11px] font-medium text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
            >
              <CornerDownRight className="w-3 h-3" />
              {isReplying ? 'Cancel' : 'Reply to thread'}
            </button>
          </div>

          {/* Inline Reply Input */}
          {isReplying && (
            <div className="mt-3 p-3 bg-slate-50 rounded-md border border-slate-200">
              <div className="text-[10px] font-semibold text-[#64748B] mb-1 flex items-center gap-1">
                <CornerDownRight className="w-3 h-3 text-[#2563EB]" />
                Replying as {currentUser.role === 'AUTHOR' ? 'Author (Blind)' : `${currentUser.first_name} ${currentUser.last_name}`}
              </div>
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Write your rebuttal argument or clarification..."
                rows={3}
                className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#2563EB] bg-white resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setReplyToId(null)}
                  className="px-2.5 py-1 text-xs text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmitting || !replyBody.trim()}
                  onClick={() => handlePost(comment.comment_id)}
                  className="px-3 py-1 bg-[#2563EB] text-white rounded text-xs font-medium hover:bg-[#1D4ED8] disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  Post Reply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Render nested children */}
        {comment.children && comment.children.map((child) => renderComment(child))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#2563EB]" />
          <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
            Threaded Rebuttal Timeline (Recursive CTE)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#64748B]">
          {comments.length} Discussion Nodes
        </span>
      </div>

      {/* Discussion List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-[#64748B]">No rebuttal comments initiated for this manuscript yet.</p>
          </div>
        ) : (
          comments.map((rootComment) => renderComment(rootComment))
        )}
      </div>

      {/* New Top-Level Comment Box */}
      <div className="mt-4 p-4 bg-white rounded-lg border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#2563EB]" />
            Post New Discussion Point
          </span>
          <span className="text-[10px] font-mono text-[#64748B]">
            Persona: {currentUser.first_name} {currentUser.last_name} ({currentUser.role})
          </span>
        </div>
        <textarea
          value={replyToId === null ? replyBody : ''}
          onChange={(e) => {
            setReplyToId(null);
            setReplyBody(e.target.value);
          }}
          placeholder="Address reviewers' technical concerns or state rebuttal revisions..."
          rows={3}
          className="w-full text-xs p-2.5 rounded-md border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#2563EB] bg-slate-50/50 resize-none text-[#0F172A]"
        />
        <div className="flex justify-between items-center mt-2.5">
          <span className="text-[10px] text-[#94A3B8]">
            Enforced double-blind aliases: Authors display as &quot;Author (Blind)&quot;
          </span>
          <button
            disabled={isSubmitting || !replyBody.trim() || replyToId !== null}
            onClick={() => handlePost(null)}
            className="px-4 py-1.5 bg-[#0F172A] text-white rounded-md text-xs font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Post Comment
          </button>
        </div>
      </div>
    </div>
  );
}
