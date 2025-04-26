import type { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Head from "next/head";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import { LoadingPage } from "~/components/loader";
import PostView from "~/components/postview";
import { generateStaticProps } from "~/server/helpers/ssg";

dayjs.extend(relativeTime);

const ProfileFeed = (props: {userId: string}) => {
  const { data, isLoading } = api.post.getPostsByUser.useQuery({userId: props.userId});

  if (isLoading) return <LoadingPage />;

  if (!data || data.length === 0) return <div>User has not posted yet.</div>

  return (
    <div className="flex flex-col">
      {data.map(userPost => {
        return (<PostView {...userPost} key={userPost.post.id}/>)
      })}
    </div>
  )
}

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
          <ProfileFeed userId={data.id} />
        </div>
      </PageLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateStaticProps();
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