"use client";

import { useEffect, useState } from "react";

interface SurveyPageProps {
  params: {
    id: string;
    token: string;
  };
}

export default function SurveyPage({ params }: SurveyPageProps) {
  const { id, token } = params;
  console.log(id);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHtml = async () => {
      try {
        const res = await fetch(`/api/survey/${id}/${token}`);
        if (!res.ok) throw new Error("Failed to fetch survey HTML");
        const text = await res.text();
        setHtmlContent(text);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchHtml();
  }, [id, token]);

  if (error)
    return <div style={{ color: "red", padding: "2rem" }}>Error: {error}</div>;
  if (!htmlContent)
    return <div style={{ padding: "2rem" }}>Loading survey...</div>;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#fff",
        zIndex: 9999,
        overflow: "auto",
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
