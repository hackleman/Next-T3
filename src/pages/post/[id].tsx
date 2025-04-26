import Head from "next/head";
import { api } from "~/utils/api";

import type { GetStaticProps, NextPage } from "next";
import { generateStaticProps } from "~/server/helpers/ssg";
import { PageLayout } from "~/components/layout";
import PostView from "~/components/postview";

const SinglePostPage: NextPage<{ id: string}> = ({ id }) => {
  const { data } = api.post.getPostById.useQuery({ id });

  if (!data) return <>404</>;

  return (
    <>
      <Head>
        <title>{`${data.post.content} - ${data.author.username}`}</title>
      </Head>
      <PageLayout>
        <PostView {...data} />
      </PageLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateStaticProps();
  const id = context.params?.id;

  if (typeof id !== "string") throw new Error("No id");

  await ssg.post.getPostById.prefetch({ id })

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id
    }
  }
}

export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking"
  }
}

export default SinglePostPage;