import { btn } from '@/Components/ui';
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
                        className={btn.secondary}
                    >
                        {loading ? 'Loading…' : 'Load more'}
                    </button>
                </div>
            )}
        </div>
    );
}
