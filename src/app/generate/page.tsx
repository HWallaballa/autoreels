"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, RefreshCw, Sparkles, Video, ArrowRight } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt_template: string;
  thumbnail_url: string | null;
}

export default function GeneratePage() {
  const [mode, setMode] = useState<"prompt" | "template">("prompt");
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    videoId: string;
    predictionId: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadTemplates() {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase
        .from("templates")
        .select("*")
        .eq("is_public", true)
        .order("name");
      setTemplates(data || []);
    }
    loadTemplates();
  }, []);

  function extractPlaceholders(template: string): string[] {
    const matches = template.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
  }

  function buildPromptFromTemplate(): string {
    if (!selectedTemplate) return "";
    let result = selectedTemplate.prompt_template;
    for (const [key, value] of Object.entries(templateVars)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    return result;
  }

  async function handleGenerate() {
    setError("");
    setGenerating(true);

    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setGenerating(false);
      return;
    }

    const finalPrompt =
      mode === "template" ? buildPromptFromTemplate() : prompt;
    const finalTitle =
      title || (mode === "template" ? selectedTemplate?.name : "Untitled");

    try {
      const res = await fetch("/api/videos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          title: finalTitle,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Generation failed");
        setGenerating(false);
        return;
      }

      setResult(data);
      setGenerating(false);
    } catch {
      setError("Something went wrong");
      setGenerating(false);
    }
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-8">
          <Sparkles className="h-10 w-10 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Video is generating!</h2>
          <p className="text-sm text-gray-400 mb-6">
            Your video is being created by AI. This usually takes 1-3 minutes.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => router.push("/dashboard/videos")}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-700 transition"
            >
              View My Videos
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setResult(null);
                setPrompt("");
                setTitle("");
                setSelectedTemplate(null);
                setTemplateVars({});
              }}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5 transition"
            >
              Generate Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Generate Video</h1>
        <p className="text-gray-400 text-sm mt-1">
          Create AI-powered short-form videos for TikTok.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("prompt")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "prompt"
              ? "bg-violet-600 text-white"
              : "bg-white/5 text-gray-400 hover:text-white"
          }`}
        >
          <Wand2 className="h-4 w-4 inline mr-2" />
          From Prompt
        </button>
        <button
          onClick={() => setMode("template")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "template"
              ? "bg-violet-600 text-white"
              : "bg-white/5 text-gray-400 hover:text-white"
          }`}
        >
          <Video className="h-4 w-4 inline mr-2" />
          From Template
        </button>
      </div>

      {mode === "prompt" ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Video Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-500 transition"
              placeholder="My awesome video"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Describe your video
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-500 transition resize-none"
              placeholder="A cinematic close-up of coffee being poured into a ceramic cup, steam rising, warm lighting, slow motion..."
            />
            <p className="text-xs text-gray-600 mt-1">
              Be detailed and specific for the best results.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Template Grid */}
          {!selectedTemplate ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTemplate(t);
                    setTitle(t.name);
                  }}
                  className="text-left rounded-xl border border-white/10 bg-white/5 p-5 hover:border-violet-500/50 hover:bg-violet-500/5 transition"
                >
                  <span className="text-xs text-violet-400 font-medium">
                    {t.category}
                  </span>
                  <h3 className="font-semibold mt-1">{t.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs text-violet-400">
                    {selectedTemplate.category}
                  </span>
                  <h3 className="font-semibold">{selectedTemplate.name}</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setTemplateVars({});
                  }}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Change template
                </button>
              </div>

              {/* Template Variables */}
              {extractPlaceholders(selectedTemplate.prompt_template).map(
                (key) => (
                  <div key={key} className="mb-3">
                    <label className="block text-sm text-gray-400 mb-1 capitalize">
                      {key.replace(/_/g, " ")}
                    </label>
                    <input
                      value={templateVars[key] || ""}
                      onChange={(e) =>
                        setTemplateVars({
                          ...templateVars,
                          [key]: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-500 transition"
                      placeholder={`Enter ${key.replace(/_/g, " ")}...`}
                    />
                  </div>
                )
              )}

              <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-gray-500 mb-1">Generated prompt:</p>
                <p className="text-sm text-gray-300">
                  {buildPromptFromTemplate()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 mt-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={
          generating ||
          (mode === "prompt" && !prompt) ||
          (mode === "template" && !selectedTemplate)
        }
        className="mt-6 w-full rounded-lg bg-violet-600 py-3 text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Video
          </>
        )}
      </button>
    </div>
  );
}
