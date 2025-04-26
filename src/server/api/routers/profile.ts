// import { z } from "zod";

import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { filterUserForClient } from "~/server/helpers/filters";

export const profileRouter = createTRPCRouter({
    getUserByUsername: publicProcedure.input(z.object({username: z.string()}))
                        .query(async ({input}) => {
                            const userclient = await clerkClient();

                            const users = (await userclient.users.getUserList({
                                username: [input.username]
                            }));

                            if (users.totalCount == 0) {
                                throw new TRPCError({
                                    code: "INTERNAL_SERVER_ERROR",
                                    message: "User Not Found"
                                });
                            }

                            console.log(users);

                            return filterUserForClient(users.data[0]!)
                        })
});
