import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import ChatInput from "@/components/ChatInput";
import AIResponseFormatter from "@/components/AIResponseFormatter";
import AuthButton from "@/components/AuthButton";

interface MessagesType {
  message: string;
  isAIorUser: string;
}

const initialMessage: MessagesType = { message: 'Hello, ask me anything about the meal you want to make!', isAIorUser: 'ai' };

// Use a Map to store messages for each meal ID
const messagesStore = new Map<string, MessagesType[]>();

const getMealDetails = async (id: string) => {
  try {
    let data = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    let mealData = await data.json();
    return mealData;
  } catch (error) {
    console.error("Error fetching meal details:", error);
    return null;
  }
}

async function getAIResponse(message: any, mealDetails: any) {
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
  let currentMessages = messagesStore.get(mealId) || [initialMessage];
  currentMessages = [...currentMessages, { message, isAIorUser: 'user' }];

  const mealDetails = await getMealDetails(mealId);
  const aiResponse = await getAIResponse(message, mealDetails);

  currentMessages.push({ message: aiResponse, isAIorUser: 'ai' });
  messagesStore.set(mealId, currentMessages);

  console.log(aiResponse);
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

  // Fetch meal details using the ID from params
  const mealDetails = await getMealDetails(params.id);

  // Get or initialize messages for this meal ID
  let messages = messagesStore.get(params.id);
  if (!messages) {
    messages = [initialMessage];
    messagesStore.set(params.id, messages);
  }

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
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.isAIorUser === 'ai' ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`flex flex-col max-w-3/4 lg:max-w-[48%] p-3 rounded-lg ${
                    msg.isAIorUser === 'ai' ? 'bg-blue-100 text-black-900' : 'bg-gray-100 text-gray-900'
                  } ${msg.isAIorUser === 'ai' ? 'self-start' : 'self-end'}`}
                  style={{
                    minWidth: msg.isAIorUser === 'ai' ? '45%' : 'auto',
                  }}
                >
                  {msg.isAIorUser === 'ai' ? (
                    <div className="flex-1 flex flex-col">
                      <AIResponseFormatter response={msg.message} />
                    </div>
                  ) : (
                    <p className="flex-1">{msg.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
        <form action={async (formData: FormData) => {
              'use server';
              await sendMessage(formData, params.id);
            }} className="mt-4">
      <div className="relative">
        <input
          type="text"
          name="message"
          placeholder="Type your message..."
          className="w-full p-4 pr-16 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button 
          type="submit" 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </form>

        </div>
      </div>
    </div>
  );
}