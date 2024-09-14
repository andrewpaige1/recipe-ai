import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import ChatInput from "@/components/ChatInput";
import AIResponseFormatter from "@/components/AIResponseFormatter";
import AuthButton from "@/components/AuthButton";

interface Message {
  id: number;
  meal_id: string;
  content: string;
  is_ai: boolean;
  created_at: string;
}

const initialMessage: Message = {
  id: 0,
  meal_id: '',
  content: 'Hello, ask me anything about the meal you want to make!',
  is_ai: true,
  created_at: new Date().toISOString(),
};

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

  const supabase = createClient();
  const message = formData.get('message') as string;

  // Insert user message
  const { data: userMessage, error: userError } = await supabase
    .from('messages')
    .insert({ meal_id: mealId, content: message, is_ai: false })
    .select()
    .single();

  if (userError) {
    console.error("Error inserting user message:", userError);
    return;
  }

  const mealDetails = await getMealDetails(mealId);
  const aiResponse = await getAIResponse(message, mealDetails);

  // Insert AI response
  const { error: aiError } = await supabase
    .from('messages')
    .insert({ meal_id: mealId, content: aiResponse, is_ai: true });

  if (aiError) {
    console.error("Error inserting AI message:", aiError);
  }

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

  // Fetch messages for this meal from the database
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('meal_id', params.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
  }

  const allMessages = messages ? [initialMessage, ...messages] : [initialMessage];

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
            {allMessages.map((msg, index) => (
              <div key={index} className={`flex ${msg.is_ai ? 'justify-start' : 'justify-end'}`}>
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