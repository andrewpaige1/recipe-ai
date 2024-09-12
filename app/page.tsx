import React from 'react';
import { FaSearch, FaList, FaQuestion, FaUtensils } from 'react-icons/fa';
import { RiAtLine } from 'react-icons/ri';
import DeployButton from "../components/DeployButton";
import AuthButton from "../components/AuthButton";
import { createClient } from "@/utils/supabase/server";
import ConnectSupabaseSteps from "@/components/tutorial/ConnectSupabaseSteps";
import SignUpUserSteps from "@/components/tutorial/SignUpUserSteps";
import Header from "@/components/Header";
import { redirect } from "next/navigation";
import Link from "next/link";

interface LandingPageProps {
  isSupabaseConnected: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ isSupabaseConnected }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center">
            <RiAtLine className="text-3xl text-green-500 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">Recipe AI</h1>
          </div>
          <nav>
            <ul className="flex space-x-4 items-center">
              <li><a href="#features" className="text-gray-600 hover:text-green-500 transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="text-gray-600 hover:text-green-500 transition-colors">How It Works</a></li>
              <li><DeployButton /></li>
              {isSupabaseConnected && <li><AuthButton /></li>}
            </ul>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <Header />
        
        <section className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Discover, Cook, and Learn with AI</h2>
          <p className="text-xl text-gray-600 mb-8">Your personal AI-powered recipe assistant</p>
          <Link
            href="/signup"
            className="bg-green-500 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-green-600 transition-colors transform hover:scale-105 duration-200"
          >
            Start Cooking
          </Link>
        </section>

        <section id="features" className="mb-16">
          <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <FaSearch />, title: "Find Recipes", description: "Search for recipes based on ingredients, cuisine, or dietary restrictions." },
              { icon: <FaList />, title: "Ingredient Lists", description: "Get detailed ingredient lists with measurements and substitutions." },
              { icon: <FaQuestion />, title: "Ask Questions", description: "Get answers about cooking techniques, nutrition, and more." },
              { icon: <FaUtensils />, title: "Cooking Instructions", description: "Step-by-step instructions to guide you through any recipe." }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center transform hover:scale-105 transition-transform duration-200">
                <div className="text-4xl text-green-500 mb-4">{feature.icon}</div>
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mb-16">
          <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">How It Works</h3>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-8">
            {[
              { step: 1, title: "Ask a Question", description: "Type in your recipe query or ingredient list." },
              { step: 2, title: "AI Processing", description: "Our AI analyzes your request and searches its vast database." },
              { step: 3, title: "Get Results", description: "Receive personalized recipes, tips, and answers instantly." }
            ].map((step, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center max-w-xs w-full">
                <div className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold">{step.step}</span>
                </div>
                <h4 className="text-xl font-semibold mb-2">{step.title}</h4>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="get-started" className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Cook Smarter?</h3>
          <p className="text-xl text-gray-600 mb-8">Join Recipe AI today and transform your cooking experience!</p>
          {isSupabaseConnected ? <SignUpUserSteps /> : <ConnectSupabaseSteps />}
        </section>
      </main>

      <footer className="w-full border-t border-t-foreground/10 p-8 flex justify-center text-center text-xs">
        <p>
          Powered by{" "}
          <a
            href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
            target="_blank"
            className="font-bold hover:underline"
            rel="noreferrer"
          >
            Supabase
          </a>
        </p>
      </footer>
    </div>
  );
};

export default async function Index() {
  const canInitSupabaseClient = () => {
    try {
      createClient();
      return true;
    } catch (e) {
      return false;
    }
  };

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return redirect("/protected/recipes");
  }

  const isSupabaseConnected = canInitSupabaseClient();

  return <LandingPage isSupabaseConnected={isSupabaseConnected} />;
}