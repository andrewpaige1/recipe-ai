import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import ChatInput from "@/components/ChatInput";
import AIResponseFormatter from "@/components/AIResponseFormatter";
import AuthButton from "@/components/AuthButton";

interface Message {
  id: number;
  content: string;
  is_ai: boolean;
}

const initialMessage: Message = {
  id: 0,
  content: 'Hello, ask me anything about the meal you want to make!',
  is_ai: true,
};

// In-memory store for the current session
let sessionMessages: { [key: string]: Message[] } = {};

const getMealDetails = async (id: string) => {
  try {
    let data = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    let mealData = await data.json();
    return mealData;
  } catch (error) {
    console.error("Error fetching meal details:", error);
    return null;
  }
};

async function getAIResponse(message: string, mealDetails: any) {
  'use server';

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/a9cc6df4285df5350badc49b627ce5a1/ai/run/@cf/meta/llama-3-8b-instruct`,
    {
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are a friendly assistant that helps with meal information. Your responses should be short, or at least easily readable like a list. 
            You are also United States based. Here are the details of the meal: ${JSON.stringify(mealDetails)}`,
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    }
  );

  const result = await response.json();
  return result.result.response;
}

async function sendMessage(formData: FormData, mealId: string) {
  'use server';

  const message = formData.get('message') as string;

  if (!sessionMessages[mealId]) {
    sessionMessages[mealId] = [initialMessage];
  }

  // Add user message to session
  const userMessage: Message = {
    id: sessionMessages[mealId].length,
    content: message,
    is_ai: false,
  };
  sessionMessages[mealId].push(userMessage);

  const mealDetails = await getMealDetails(mealId);
  const aiResponse = await getAIResponse(message, mealDetails);

  // Add AI response to session
  const aiMessage: Message = {
    id: sessionMessages[mealId].length,
    content: aiResponse,
    is_ai: true,
  };
  sessionMessages[mealId].push(aiMessage);

  revalidatePath(`/protected/chat/${mealId}`);
}

export default async function ProtectedPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch meal details
  const mealDetails = await getMealDetails(params.id);

  // Get messages for the current session
  const messages = sessionMessages[params.id] || [initialMessage];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <nav className="w-full bg-white shadow-sm">
        <div className="w-full max-w-4xl mx-auto flex justify-between items-center p-4">
          <h1 className="text-xl font-semibold text-gray-800">
            {mealDetails?.meals?.[0]?.strMeal || 'Unknown'}
          </h1>
          <AuthButton/>
        </div>
      </nav>

      <div className="flex-1 w-full max-w-4xl mx-auto p-4 flex flex-col">
        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.is_ai ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`flex flex-col max-w-3/4 lg:max-w-[48%] p-3 rounded-lg ${
                    msg.is_ai ? 'bg-blue-100 text-black-900' : 'bg-gray-100 text-gray-900'
                  } ${msg.is_ai ? 'self-start' : 'self-end'}`}
                  style={{
                    minWidth: msg.is_ai ? '45%' : 'auto',
                  }}
                >
                  {msg.is_ai ? (
                    <div className="flex-1 flex flex-col">
                      <AIResponseFormatter response={msg.content} />
                    </div>
                  ) : (
                    <p className="flex-1">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <ChatInput
            sendMessage={async (formData: FormData) => {
              'use server';
              await sendMessage(formData, params.id);
            }}
          />
        </div>
      </div>
    </div>
  );
}