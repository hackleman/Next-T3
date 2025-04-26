import { useUser } from "@clerk/nextjs";
import Head from "next/head";
import { api } from "~/utils/api";

import type { NextPage } from "next";

const SinglePostPage: NextPage = () => {
  const { isLoaded: userLoaded } = useUser();
  api.post.getAll.useQuery();

  if (!userLoaded) return <></>;

  return (
    <>
      <Head>
        <title>Post</title>
      </Head>
      <main className="flex justify-center h-screen">
        <div className="w-full h-full flex justify-center">
            Post View
        </div>
      </main>
    </>
  );
}

export default SinglePostPage;