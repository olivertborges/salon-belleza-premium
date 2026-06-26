'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Send, User, MessageCircle, Heart, Loader2 } from 'lucide-react'

interface Comment {
  id: string
  user_id: string
  comment: string
  created_at: string
  profile?: {
    full_name: string
    avatar_url: string
  }
}

interface CommentsProps {
  lessonId: string
}

export function Comments({ lessonId }: CommentsProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_comments')
        .select(`
          id,
          user_id,
          comment,
          created_at,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('lesson_comments')
        .insert([{
          lesson_id: lessonId,
          user_id: user.id,
          comment: newComment.trim()
        }])

      if (error) throw error
      setNewComment('')
      await loadComments()
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [lessonId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-mutedForeground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Lista de comentarios */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-mutedForeground text-xs">
          <MessageCircle className="w-8 h-8 text-mutedForeground/30 mx-auto mb-2" />
          No hay comentarios todavía. Sé el primero en comentar.
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 rounded-xl bg-muted/10 border border-border">
              <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                {comment.profile?.avatar_url ? (
                  <img 
                    src={comment.profile.avatar_url} 
                    alt={comment.profile.full_name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-rose-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {comment.profile?.full_name || 'Usuario'}
                  </span>
                  <span className="text-[9px] text-mutedForeground font-mono">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-mutedForeground mt-1">{comment.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario para nuevo comentario */}
      {user && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
            className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-rose-500/50"
          />
          <button
            type="submit"
            disabled={sending || !newComment.trim()}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all disabled:opacity-50 flex items-center gap-1"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      )}
    </div>
  )
}
