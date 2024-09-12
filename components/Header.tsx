
export default function Header() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <div className="flex gap-8 justify-center items-center">
        <span className="border-l rotate-45 h-6" />
      </div>
      <div className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
        <p
          className="font-bold hover:underline"
          rel="noreferrer"
        >
          Recipe AI
        </p>
      </div>
    </div>
  );
}
