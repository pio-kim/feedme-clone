"use client";

import { useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import type { ConvertedPage } from "./convert-url";
import {
  MAX_URL_QUERY_LENGTH,
  PROMPT_PRESETS,
  buildLlmMessage,
  buildLlmUrl,
  toFileName,
  toMarkdownDocument,
  type LlmTarget,
} from "./llm-handoff";

const CUSTOM_PROMPT = "custom";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; page: ConvertedPage };

export function Converter() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim()) return;
    setStatus({ kind: "loading" });
    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus({ kind: "error", message: data.error });
        return;
      }
      setStatus({ kind: "done", page: data });
    } catch {
      setStatus({ kind: "error", message: "서버에 연결하지 못했습니다." });
    }
  }

  function handleReset() {
    setUrl("");
    setStatus({ kind: "idle" });
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Input
            type="text"
            inputMode="url"
            aria-label="웹 페이지 URL"
            placeholder="https://example.com/article"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="h-10 pr-10"
          />
          {url && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="입력 지우기"
              onClick={handleReset}
              className="absolute top-1/2 right-1 -translate-y-1/2"
            >
              <XIcon />
            </Button>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-10"
          disabled={!url.trim() || status.kind === "loading"}
        >
          {status.kind === "loading" && (
            <Loader2Icon data-icon="inline-start" className="animate-spin" />
          )}
          변환하기
        </Button>
      </form>

      {status.kind === "loading" && <ResultSkeleton />}
      {status.kind === "error" && (
        <Alert variant="destructive">
          <AlertTitle>변환하지 못했습니다</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}
      {status.kind === "done" && <Result page={status.page} />}
    </div>
  );
}

function ResultSkeleton() {
  return (
    <Card aria-label="변환 중">
      <CardHeader>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </CardContent>
    </Card>
  );
}

function Result({ page }: { page: ConvertedPage }) {
  const [promptChoice, setPromptChoice] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const document = toMarkdownDocument(page);
  const byline = [...new Set([page.author, page.site].filter(Boolean))];

  const prompt =
    promptChoice === CUSTOM_PROMPT
      ? customPrompt
      : (PROMPT_PRESETS.find((preset) => preset.id === promptChoice)?.text ??
        "");

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  async function handleCopy() {
    if (await copy(document)) toast.success("Markdown을 복사했습니다.");
    else toast.error("클립보드에 복사하지 못했습니다.");
  }

  function handleDownload() {
    const blob = new Blob([document], { type: "text/markdown;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = href;
    link.download = toFileName(page.title);
    link.click();
    URL.revokeObjectURL(href);
  }

  async function handleOpen(target: LlmTarget) {
    const message = buildLlmMessage(document, prompt);
    if (message.length <= MAX_URL_QUERY_LENGTH) {
      window.open(buildLlmUrl(target, message), "_blank", "noopener");
      return;
    }
    // Too long for a URL: hand the full message over via the clipboard.
    const copied = await copy(message);
    window.open(buildLlmUrl(target, ""), "_blank", "noopener");
    if (copied) {
      toast.info("본문이 길어 클립보드에 복사했습니다. 새 창에 붙여넣어 주세요.");
    } else {
      toast.error("본문이 길어 바로 넘기지 못했습니다. 복사 후 붙여넣어 주세요.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{page.title}</CardTitle>
        <CardDescription>
          {byline.map((part) => `${part} · `)}
          <a
            href={page.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            원문 보기
          </a>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleCopy}>
            <CopyIcon data-icon="inline-start" />
            복사하기
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <DownloadIcon data-icon="inline-start" />
            .md 다운로드
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">LLM으로 열기</p>
          <ToggleGroup
            variant="outline"
            size="sm"
            aria-label="프롬프트 선택"
            className="flex-wrap [&_[aria-pressed=true]]:bg-primary! [&_[aria-pressed=true]]:text-primary-foreground!"
            value={promptChoice ? [promptChoice] : []}
            onValueChange={(value) => setPromptChoice(value[0] ?? null)}
          >
            {PROMPT_PRESETS.map((preset) => (
              <ToggleGroupItem key={preset.id} value={preset.id}>
                {preset.label}
              </ToggleGroupItem>
            ))}
            <ToggleGroupItem value={CUSTOM_PROMPT}>직접 입력</ToggleGroupItem>
          </ToggleGroup>
          {promptChoice === CUSTOM_PROMPT && (
            <Input
              aria-label="직접 입력한 프롬프트"
              placeholder="LLM에게 함께 보낼 요청을 입력하세요"
              value={customPrompt}
              onChange={(event) => setCustomPrompt(event.target.value)}
              autoFocus
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleOpen("chatgpt")}>
              <ExternalLinkIcon data-icon="inline-start" />
              ChatGPT로 열기
            </Button>
            <Button onClick={() => handleOpen("claude")}>
              <ExternalLinkIcon data-icon="inline-start" />
              Claude로 열기
            </Button>
          </div>
        </div>
      </CardContent>

      <Separator />

      <CardContent>
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{page.markdown}</ReactMarkdown>
        </article>
      </CardContent>
    </Card>
  );
}
