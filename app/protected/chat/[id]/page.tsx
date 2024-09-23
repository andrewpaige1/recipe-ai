import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ChatInput from "@/components/ChatInput";
import AuthButton from "@/components/AuthButton";
import Link from 'next/link'

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
  content: "Hello! I'm your culinary assistant. How can I help you with this meal today?",
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

export default async function ProtectedPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const mealDetails = await getMealDetails(params.id);

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
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="w-full bg-white shadow-md">
        <div className="w-full max-w-5xl mx-auto flex justify-between items-center p-4">
          <Link href="/protected" className="text-2xl font-bold text-blue-800">
            {mealDetails?.meals?.[0]?.strMeal || 'Culinary Assistant'}
          </Link>
          <AuthButton />
        </div>
      </nav>

      <div className="flex-1 w-full max-w-5xl mx-auto p-6 flex flex-col">
        <ChatInput mealId={params.id} initialMessages={allMessages} />
      </div>
    </div>
  );
}