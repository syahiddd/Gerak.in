import { CursorPage, FeedPost } from '@/types';
import { router } from '@inertiajs/react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import WorkoutPostCard from './WorkoutPostCard';

/**
 * Cursor-paginated list of posts. "Load more" fetches only the `posts` prop
 * and appends it, keeping the URL clean so a refresh starts from the top.
 */
export default function PostList({ posts, empty }: { posts: CursorPage<FeedPost>; empty: ReactNode }) {
    const [items, setItems] = useState(posts.data);
    const [loading, setLoading] = useState(false);
    const appending = useRef(false);

    useEffect(() => {
        setItems((prev) => (appending.current ? [...prev, ...posts.data.filter((p) => !prev.some((x) => x.id === p.id))] : posts.data));
        appending.current = false;
    }, [posts]);

    const loadMore = () => {
        if (!posts.next_cursor) return;
        appending.current = true;
        setLoading(true);
        router.reload({
            data: { cursor: posts.next_cursor },
            only: ['posts'],
            preserveUrl: true,
            onFinish: () => setLoading(false),
        });
    };

    if (items.length === 0) return <>{empty}</>;

    return (
        <div className="space-y-4">
            {items.map((p) => (
                <WorkoutPostCard key={p.id} post={p} />
            ))}
            {posts.next_cursor && (
                <div className="flex justify-center pt-2">
                    <button
                        type="button"
                        onClick={loadMore}
                        disabled={loading}
                        className="rounded-xl border border-zinc-300 px-5 py-2 text-sm font-bold hover:bg-white disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                        {loading ? 'Loading…' : 'Load more'}
                    </button>
                </div>
            )}
        </div>
    );
}
