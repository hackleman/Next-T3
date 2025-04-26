import type { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Head from "next/head";
import SuperJSON from "superjson";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { createServerSideHelpers } from '@trpc/react-query/server';

import { api } from "~/utils/api";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";
import { PageLayout } from "~/components/layout";

dayjs.extend(relativeTime);

const pfpSize = 128;

const ProfilePage: NextPage<{username: string}> = ({ username }) => {
  const { data } = api.profile.getUserByUsername.useQuery({ username });

  if (!data) return <div>404</div>

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div className="relative h-36  bg-slate-600">
          <Image 
            src={data.pfp} 
            alt={`${data.username ?? ""}'s profile pic`}
            width={128}
            height={128}

            className="absolute bottom-0 left-0 -mb-[64px] ml-4 rounded-full 
            border-4 border-black bg-black"
          />
          <div className="h-[192px]"></div>
          <div className="p-6 text-2xl font-bold">{`@${data.username ?? ""}`}</div>
          <div className="border-b border-slate-400 w-full"></div>
        </div>
      </PageLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { db, userId: null },
    transformer: SuperJSON, // optional - adds superjson serialization
  });

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("No Slug");
  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({username})

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username
    }
  }
}

export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking"
  }
}

export default ProfilePage;