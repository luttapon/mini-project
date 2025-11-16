"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
import { useFollowedGroups } from "@/lib/context/FollowedGroupsContext";
import GroupCalendar from "@/app/components/GroupCalendar";
import PostFeed from "@/app/components/PostFeed";
import PostInputBar from "@/app/components/PostInputBar";
import type {
  PostWithUser as SupabasePostWithUser,
  CommentWithUser,
} from "@/types/supabase";

interface GroupMinimal {
  id: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  owner_id: string;
}

interface PostFromDB {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  media_urls?: string[];
  likes_count?: number;
  liked_by_user?: boolean;
  comments?: CommentWithUser[] | null;
  created_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string | null;
    created_at?: string | null;
  };
  likes?: { user_id: string }[] | null;
}

type FeedPost = Omit<SupabasePostWithUser, "media_urls"> & {
  media_urls: string[];
};

export default function GroupDetailPage() {
  const { groupId } = useParams() as { groupId: string };
  const router = useRouter();
  const [group, setGroup] = useState<GroupMinimal | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const { refreshGroups } = useFollowedGroups();

  const [coverUrl, setCoverUrl] = useState("/default-cover.jpg");
  const [avatarUrl, setAvatarUrl] = useState("/default-group.png");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setCoverUrl("/default-cover.jpg");
      setAvatarUrl("/default-group.png");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      if (!groupId) return;

      // Fetch group
      const { data: groupData } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single<GroupMinimal>();
      setGroup(groupData || null);

      let fetchedAvatarUrl = "/default-group.png";
      let fetchedCoverUrl = "/default-cover.jpg";

      if (groupData) {
        if (groupData.cover_url) {
          const { data, error } = await supabase.storage
            .from("groups")
            .createSignedUrl(groupData.cover_url.replace(/^\/+/, ""), 3600);
          if (!error) fetchedCoverUrl = data.signedUrl;
        }
        if (groupData.avatar_url) {
          const { data, error } = await supabase.storage
            .from("groups")
            .createSignedUrl(groupData.avatar_url.replace(/^\/+/, ""), 3600);
          if (!error) fetchedAvatarUrl = data.signedUrl;
        }
        setCoverUrl(fetchedCoverUrl);
        setAvatarUrl(fetchedAvatarUrl);
      } else {
        setLoading(false);
        return;
      }

      // Check follow
      if (user) {
        const { data: followData } = await supabase
          .from("group_members")
          .select("*")
          .eq("user_id", user.id)
          .eq("group_id", groupId)
          .maybeSingle();
        setIsFollowing(!!followData);
      }

      // Count followers
      const { count } = await supabase
        .from("group_members")
        .select("user_id", { count: "exact", head: true })
        .eq("group_id", groupId);
      setFollowersCount(count || 0);

      // Upsert read status
      if (user && groupData) {
        const { data, error } = await supabase
          .from("user_group_read_status")
          .upsert(
            {
              user_id: user.id,
              group_id: groupId,
              last_read_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id,group_id", // ใช้ string เดียว
            }
          );

        if (error) {
          console.error("Failed to update read status:", error);
        }
      }

      // Fetch posts
      const { data: postData } = await supabase
        .from("posts")
        .select(
          "*, user:user_id(id, username, avatar_url, created_at), likes(user_id), comments(*, user:user_id(id, username, avatar_url))"
        )
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      // Map posts
      const formattedPosts: FeedPost[] = ((postData as PostFromDB[]) || []).map(
        (p) => {
          const didUserLike =
            p.likes?.some((like) => like.user_id === user?.id) || false;
          let postUser = p.user;

          // แสดงชื่อและรูปกลุ่มหากโพสต์จากเจ้าของกลุ่ม
          if (groupData && p.user_id === groupData.owner_id) {
            postUser = {
              id: p.user_id,
              username: groupData.name,
              avatar_url: groupData.avatar_url ?? null,
              created_at: p.user?.created_at ?? null,
            };
          }

          return {
            id: p.id,
            group_id: p.group_id,
            user_id: p.user_id,
            content: p.content,
            media_urls: p.media_urls || [],
            likes_count: p.likes?.length || 0,
            liked_by_user: didUserLike,
            comments: (p.comments as SupabasePostWithUser["comments"]) || [],
            created_at: p.created_at,
            user: {
              id: postUser?.id || "",
              username: postUser?.username || "Unknown",
              avatar_url: postUser?.avatar_url ?? null,
              created_at: postUser?.created_at || null,
            },
          };
        }
      );

      setPosts(formattedPosts);
      setLoading(false);
    };

    fetchData();
  }, [groupId]);

  if (loading)
    return <p className="p-4 text-center text-gray-500">Loading...</p>;
  if (!group)
    return <p className="p-4 text-center text-red-500">Group not found</p>;

  const handleFollowToggle = async () => {
    if (!userId || !group) return;
    if (isFollowing) {
      await supabase
        .from("group_members")
        .delete()
        .eq("user_id", userId)
        .eq("group_id", group.id);
      setIsFollowing(false);
      setFollowersCount((c) => c - 1);
    } else {
      await supabase
        .from("group_members")
        .insert([{ user_id: userId, group_id: group.id }]);
      setIsFollowing(true);
      setFollowersCount((c) => c + 1);
    }
    refreshGroups();
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    if (!window.confirm("คุณต้องการลบกลุ่มนี้จริงหรือไม่?")) return;

    if (group.avatar_url)
      await supabase.storage
        .from("groups")
        .remove([group.avatar_url.replace(/^\/+/, "")]);
    if (group.cover_url)
      await supabase.storage
        .from("groups")
        .remove([group.cover_url.replace(/^\/+/, "")]);
    await supabase.from("groups").delete().eq("id", group.id);
    refreshGroups();
    router.push("/groups");
  };

  const handleNewPost = (post: SupabasePostWithUser) => {
    let postUser = post.user;
    if (group && post.user_id === group.owner_id && postUser) {
      postUser = {
        ...postUser,
        username: group.name,
        avatar_url: group.avatar_url ?? null,
      };
    }
    const newFeedPost: FeedPost = {
      ...post,
      media_urls: post.media_urls || [],
      likes_count: post.likes_count || 0,
      liked_by_user: post.liked_by_user || false,
      comments: post.comments || [],
      user: postUser || {
        id: post.user_id,
        username: "Unknown",
        avatar_url: null,
        created_at: null,
      },
    };
    setPosts((prev) => [newFeedPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  };

  const handlePostUpdated = (updatedPost: SupabasePostWithUser) => {
    let postUser = updatedPost.user;
    if (group && updatedPost.user_id === group.owner_id && postUser) {
      postUser = {
        ...postUser,
        username: group.name,
        avatar_url: group.avatar_url ?? null,
      };
    }
    const updatedFeedPost: FeedPost = {
      ...updatedPost,
      media_urls: updatedPost.media_urls || [],
      user: postUser || {
        id: updatedPost.user_id,
        username: "Unknown",
        avatar_url: null,
        created_at: null,
      },
    };
    setPosts((prevPosts) =>
      prevPosts.map((p) => (p.id === updatedFeedPost.id ? updatedFeedPost : p))
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header Area */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="relative w-full h-44 md:h-52 lg:h-60">
          <Image
            src={coverUrl}
            alt="Group Cover"
            fill
            className="object-cover opacity-40"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        <div className="px-6 pb-6 pt-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                <Image
                  src={avatarUrl}
                  alt="Group Avatar"
                  width={128}
                  height={128}
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="mb-2 md:mb-4 pt-10">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 break-words">
                  {group.name}
                </h1>
                <p className="text-gray-500 font-medium text-sm md:text-base mt-1">
                  {followersCount} ผู้ติดตาม
                </p>
              </div>
            </div>

            <div className="flex flex-row gap-3 mt-4 md:mt-0">
              {userId === group.owner_id ? (
                <>
                  <button
                    onClick={() => router.push(`/groups/${group.id}/edit`)}
                    className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full font-semibold transition shadow-md"
                  >
                    แก้ไขกลุ่ม
                  </button>
                  <button
                    onClick={handleDeleteGroup}
                    className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition shadow-md"
                  >
                    ลบกลุ่ม
                  </button>
                </>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  className={`px-5 py-2.5 rounded-full font-semibold transition shadow-md ${
                    isFollowing
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      : "bg-sky-600 text-white hover:bg-sky-700"
                  }`}
                >
                  {isFollowing ? "✔️ กำลังติดตาม" : "+ ติดตาม"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-1 space-y-6">
          {group.description && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                เกี่ยวกับกลุ่ม
              </h2>
              <p className="text-gray-700 break-words whitespace-pre-wrap">
                {group.description}
              </p>
            </div>
          )}

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              ปฏิทินกิจกรรม
            </h2>
            <GroupCalendar
              groupId={group.id}
              userId={userId}
              isOwner={userId === group.owner_id}
            />
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {userId === group.owner_id && (
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
              <PostInputBar
                groupId={group.id}
                userId={userId}
                onPosted={handleNewPost}
              />
            </div>
          )}

          <PostFeed
            posts={posts}
            groupName={group.name}
            groupAvatar={avatarUrl}
            userId={userId}
            onPostDeleted={handlePostDeleted}
            onPostUpdated={handlePostUpdated}
            groupOwnerId={group.owner_id}
          />
        </div>
      </div>
    </div>
  );
}
