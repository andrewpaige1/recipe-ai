import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

async function run(model: string, input: object) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/a9cc6df4285df5350badc49b627ce5a1/ai/run/${model}`,
    {
      headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
      method: "POST",
      body: JSON.stringify(input),
    }
  );
  const result = await response.json();
  return result;
}

export default async function ProtectedPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Generate AI story
  const aiResponse = await run("@cf/meta/llama-3-8b-instruct", {
    messages: [
      {
        role: "system",
        content: "You are a friendly assistant that helps with cooking recipes",
      },
      {
        role: "user",
        content:
          "write a coupple of sentences about your favorite meal",
      },
    ],
  });

  const aiStory = aiResponse.result.response;

  return (
    <div className="flex-1 w-full flex flex-col h-screen bg-gray-50">
      <nav className="w-full bg-white shadow-sm">
        <div className="w-full max-w-4xl mx-auto flex justify-between items-center p-4">
          <h1 className="text-xl font-semibold text-gray-800">Chat</h1>
          <button className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <div className="flex-1 w-full max-w-4xl mx-auto p-4 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 bg-white rounded-lg shadow-sm p-4">
          <div className="mb-4">
            <p className="font-semibold text-gray-700">User 1</p>
            <p className="bg-gray-100 p-3 rounded-lg inline-block max-w-[70%]">Hello! How are you?</p>
          </div>
          <div className="mb-4 text-right">
            <p className="font-semibold text-gray-700">You</p>
            <p className="bg-blue-100 p-3 rounded-lg inline-block max-w-[70%]">I'm doing well, thanks! How about you?</p>
          </div>
          <div className="mb-4">
            <p className="font-semibold text-gray-700">AI Assistant</p>
            <p className="bg-green-100 p-3 rounded-lg inline-block max-w-[70%]">{aiStory}</p>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Type your message..."
            className="w-full p-4 pr-16 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}