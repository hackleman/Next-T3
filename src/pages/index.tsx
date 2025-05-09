import { SignInButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { api } from "~/utils/api";

import { Loader, LoadingPage } from "~/components/loader";
import { useState } from "react";
import toast from "react-hot-toast";
import { PageLayout } from "~/components/layout";
import PostView from "~/components/postview";


const CreatePostWizard = () => {
  const { user } = useUser();
  const [input, setInput] = useState("");

  const ctx = api.useContext();

  const { mutate, isPending } = api.post.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.post.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      console.log(errorMessage);
      if (errorMessage) {
        toast.error(errorMessage.join("|"));
      } else {
        toast.error("Failed to post! Please try again later.");
      }
    }
  });

  if (!user) return null;
  return (
    <div className="flex gap-4 w-full">
      <Image src={user.imageUrl} alt="profile image" width="48" height="48" className="rounded-full"/>
      <input 
        placeholder="Type some emojis" 
        className="bg-transparent grow outline-none"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input !== ""){
              mutate({ content: input })
            }
          }

        }}
        disabled={isPending}
      />
      {
        input !== "" && !isPending && <button onClick={() => mutate({content: input})} disabled={isPending}>Post</button>
      }
      {
        isPending && (
          <div className="flex items-center justify-center">
            <Loader size={20} />
          </div>
        )
      }
    </div>
  )
}

const Feed = () => {
  const { data, isLoading: postsLoading } = api.post.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong!</div>;

  return (
    <div className="flex flex-col">
        {data.map((fullPost, index) => (
            <PostView {...fullPost} key={index}/>
        ))}
    </div>
  )
}

export default function Home() {
  const { isLoaded: userLoaded, isSignedIn} = useUser();
  api.post.getAll.useQuery();

  if (!userLoaded) return <></>;

  return (
    <PageLayout>
      <div className="border-b border-slate-400 p-4 flex">
        {!isSignedIn && <div className="flex justify-center"><SignInButton /></div>}
        {!!isSignedIn && <CreatePostWizard/>}
      </div>
      <Feed />
    </PageLayout>
  );
}
