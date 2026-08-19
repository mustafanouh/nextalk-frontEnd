'use client';

import { useEffect, useRef } from 'react';
import { useMessages } from '../hooks/useMessages';
import { MessageBubble } from './MessageBubble';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/States';
import { Loader2 } from 'lucide-react';

export function MessageList({ conversationId }: { conversationId: number }) {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef(0);

  // Flatten: pages[0] = newest page, so reverse pages then reverse each
  // page's (newest-first) items to get true chronological (oldest -> newest).
  const messages = (data?.pages ?? [])
    .slice()
    .reverse()
    .flatMap((page) => page.data.slice().reverse());

  // Auto-scroll to bottom on first load / new own messages.
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (!scrollRef.current) return;
    if (isFirstLoad.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isFirstLoad.current = false;
    }
  }, [messages.length]);

  // Load older messages when scrolling near the top, preserving scroll position.
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const container = scrollRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          prevScrollHeight.current = container.scrollHeight;
          fetchNextPage();
        }
      },
      { root: container, threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (!scrollRef.current || prevScrollHeight.current === 0) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevScrollHeight.current;
    prevScrollHeight.current = 0;
  }, [messages.length]);

  if (isLoading) return <LoadingState label="جاري تحميل الرسائل..." />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (messages.length === 0) return <EmptyState title="لا توجد رسائل بعد" description="ابدأ المحادثة الآن" />;

  return (
    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
      <div ref={topSentinelRef} />
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      )}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
