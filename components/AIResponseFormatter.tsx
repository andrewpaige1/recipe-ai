"use client";

import React from 'react';

interface ContentItem {
  type: 'listItem' | 'text';
  text: string;
  formattedText?: React.ReactNode;
}

interface Section {
  title: string;
  content: ContentItem[];
}

interface AIResponseFormatterProps {
  response: string;
  truncated?: boolean;
}

const AIResponseFormatter: React.FC<AIResponseFormatterProps> = ({ response, truncated }) => {
  const formatText = (text: string): React.ReactNode => {
    return text.split(/(\*\*.*?\*\*)/).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const parseResponse = (text: string): Section[] => {
    if (!text) return [];

    const lines = text.trim().split('\n');
    let currentSection: Section | null = null;
    const sections: Section[] = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmedLine.replace(/\*\*/g, '').trim(),
          content: []
        };
      } else if (trimmedLine.startsWith('*')) {
        if (!currentSection) {
          currentSection = { title: '', content: [] };
        }
        currentSection.content.push({
          type: 'listItem',
          text: trimmedLine.substring(1).trim(),
          formattedText: formatText(trimmedLine.substring(1).trim())
        });
      } else if (trimmedLine) {
        if (!currentSection) {
          currentSection = { title: '', content: [] };
        }
        currentSection.content.push({
          type: 'text',
          text: trimmedLine,
          formattedText: formatText(trimmedLine)
        });
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  const renderContent = (content: ContentItem[]): React.ReactNode => {
    return content.map((item, index) => {
      if (item.type === 'listItem') {
        return <li key={index} className="mb-1 last:mb-0">{item.formattedText || item.text}</li>;
      } else {
        return <p key={index} className="mb-2 last:mb-0">{item.formattedText || item.text}</p>;
      }
    });
  };

  const parsedResponse = parseResponse(response);

  if (!response) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {parsedResponse.map((section, index) => (
        <div key={index} className="mb-2 last:mb-0">
          {section.title && <h3 className="text-lg font-semibold mb-1">{formatText(section.title)}</h3>}
          {section.content.some(item => item.type === 'listItem') ? (
            <ul className="list-disc pl-5 space-y-1">
              {renderContent(section.content)}
            </ul>
          ) : (
            renderContent(section.content)
          )}
        </div>
      ))}
      {truncated && (
        <p className="text-red-500 font-semibold mt-2">
          [Response truncated due to length]
        </p>
      )}
    </div>
  );
};

export default AIResponseFormatter;