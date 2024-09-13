import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import MealCard from "../../components/MealCard";
import HeaderTitle from "../../components/HeaderTitle";
import AuthButton from "@/components/AuthButton";


export default async function ProtectedPage() {

  let data = await fetch('https://www.themealdb.com/api/json/v1/1/filter.php?a=american')
  let mealData = await data.json()
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <div className="w-full">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-4xl flex justify-between items-center p-3 text-sm">
          <HeaderTitle/>
          <AuthButton />
          </div>
        </nav>
      </div>
      <ul className="flex flex-wrap gap-4 justify-center">
      {mealData.meals.map((meal: any) => (
        <div key={meal.idMeal}>
          <li key={meal.idMeal} className="w-60 flex-shrink-0">
            <MealCard thumbnail={meal.strMealThumb} mealTitle={meal.strMeal} mealID={meal.idMeal} />
          </li>        
        </div>
      ))}
    </ul>    
    </div>
  );
}