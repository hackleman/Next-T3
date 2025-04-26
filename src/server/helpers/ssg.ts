import { createServerSideHelpers } from '@trpc/react-query/server';
import SuperJSON from "superjson";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

export const generateStaticProps = () => {
  return createServerSideHelpers({
    router: appRouter,
    ctx: { db, userId: null },
    transformer: SuperJSON, // optional - adds superjson serialization
  });
}