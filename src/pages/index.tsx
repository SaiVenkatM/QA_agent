import Head from "next/head";
import { SignIn, SignInButton, SignOutButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { type NextPage } from "next";
import { testRouter } from "~/server/api/routers/test";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const {user} = useUser();

  if (!user) return null;

  return (
    <div className="flex gap-4">
      <img src={user.profileImageUrl}
      alt="Profile image"
      className="h-12 w-12 rounded-full"/>
      <div  className="bg-transparent" />
      <SignOutButton />
    </div>
  );
}


const Home: NextPage = () => {

 const user = useUser();

  const {data, isLoading} = api.tests.getAllTests.useQuery();

  if (isLoading) return <div>Loading...</div>

  if (!data) return <div>Something went wrong</div>;

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full border-x border-slate-400 md:max-w-5xl">
          <div className ="flex border-b border-slate-400 p-4">
            {!user.isSignedIn && (
              <div className="flex justify-center">
                <SignInButton />
              </div>
            )}
            {user.isSignedIn && <CreatePostWizard/>}
          </div>
          {user.isSignedIn &&
            //code below is the dashboard of the database status
            <div className="flex flex-col">
              {[...data]?.map((testTable) => (
                <div key={testTable.id} className="border-b border-slate-400 p-8">
                  <div className="flex gap-10">
                    <span>{testTable.name}</span>
                    <span>{testTable.updatedAt.toLocaleString()}</span>
                    <span>{testTable.status}</span>
                    {testTable.duration}
                  </div>
                </div>
              ))}
          </div>}
        </div>
        <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
      </main>
    </>
  );
}

export default Home;