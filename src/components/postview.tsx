import type { RouterOutputs } from "~/utils/api";
import Image from "next/image";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type UserPost = RouterOutputs["post"]["getAll"][number];

const PostView = (props: UserPost) => {
  const { post, author } = props;

  return (
    <div key={post.id} className="p-4 gap-3 border-b border-slate-400 flex">
      <Image 
          src={author.pfp} 
          alt={`@${author.username}'s profile pic`} 
          width="48" height="48" 
          className="rounded-full"
        />
      <div className="flex flex-col">
        <div className="flex gap-1 text-slate-300">
          <Link href={`/@${author.username}`}><span>@{author.username}</span></Link>
          <Link href={`/post/${post.id}`}>
            <span className="font-thin">{` ·  ${dayjs(post.createdAt).fromNow()}`}</span>
          </Link>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  )
}

export default PostView;