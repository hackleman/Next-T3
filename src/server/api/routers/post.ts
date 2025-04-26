import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis"; // see below for cloudflare and fastly adapters
import { filterUserForClient } from "~/server/helpers/filters";
import type { Post } from "@prisma/client";
import { G } from "node_modules/@upstash/redis/zmscore-CjoCv9kz.mjs";

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

const UserDataPosts = async (posts: Post[]) => {
  const userclient = await clerkClient();
  const users = (await userclient.users.getUserList({
    userId: posts.map((post) => post.authorId),
    limit: 100
  })).data.map(filterUserForClient);

  console.log(users);
  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);

    if (!author?.username) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Author for post not found"});
    
    return {
      post,
      author: {
        ...author,
        username: author.username
      }
    }
  });
}

export const postRouter = createTRPCRouter({
    getAll: publicProcedure
      .query(async ({ctx}) => {
        const posts = await ctx.db.post.findMany({
          take: 100,
          orderBy: [{
            createdAt: "desc"
          }]
        });

        return UserDataPosts(posts);
      }),
    
    getPostsByUser: publicProcedure.input(z.object({userId: z.string()}))
      .query(async ({ctx, input}) => {
        return ctx.db.post.findMany({
          where: {
            authorId: input.userId
          },
          take: 100,
          orderBy: [{ createdAt: "desc"}]
        }).then(UserDataPosts);
      }),
    
    getPostById: publicProcedure
      .input(z.object({ id: z.string()}))
      .query(async ({ctx, input}) => {
        const post = await ctx.db.post.findUnique({
          where: {id: input.id}
        });

        if (!post) throw new TRPCError({ code: "NOT_FOUND" });

        return (await UserDataPosts([post]))[0];
      }),

    create: privateProcedure
      .input(
        z.object({
            content: z.string().emoji("Only emojis are allowed").min(1).max(280)
        }))
      .mutation(async ({ctx, input}) => {
        const authorId = ctx.userId;

        const { success } = await ratelimit.limit(authorId);

        if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" })

        const post = await ctx.db.post.create({
          data: {
            authorId,
            content: input.content
          }
        });

        return post;
      })
});
