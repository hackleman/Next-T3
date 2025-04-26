import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis"; // see below for cloudflare and fastly adapters
import { filterUserForClient } from "~/server/helpers/filters";

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

export const postRouter = createTRPCRouter({
    getAll: publicProcedure
      .query(async ({ctx}) => {
        const posts = await ctx.db.post.findMany({
          take: 100,
          orderBy: [{
            createdAt: "desc"
          }]
        });

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
