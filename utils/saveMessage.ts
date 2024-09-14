import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from "@/utils/supabase/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { message, mealId } = req.body;

    // Fetch meal details
    const mealDetails = await getMealDetails(mealId);

    // Get AI response
    const aiResponse = await getAIResponse(message, mealDetails);

    res.status(200).json(aiResponse);
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function getMealDetails(id: string) {
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