// import { z } from "zod";

import { clerkClient, type User } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    pfp: user.imageUrl
  }
}

export const postRouter = createTRPCRouter({
    getAll: publicProcedure
      .query(async ({ctx}) => {
        const posts = await ctx.db.post.findMany({
          take: 100
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
    })
});
