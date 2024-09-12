export default function MessagesList({ messages }: { messages: any[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((messageObj: any, index: number) => (
        <div key={index} className={`mb-4 ${messageObj.isAIorUser === 'user' ? 'text-right' : ''}`}>
          <p className="font-semibold text-gray-700">
            {messageObj.isAIorUser === 'user' ? 'You' : 'AI'}
          </p>
          <p className={`p-3 rounded-lg inline-block max-w-[70%] ${
            messageObj.isAIorUser === 'user' ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            {messageObj.message}
          </p>
        </div>
      ))}
    </div>
  );
}