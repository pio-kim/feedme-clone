import { Converter } from "@/features/converter/converter";
import { ThemeToggle } from "@/features/theme/theme-toggle";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between">
        <span className="font-heading text-lg font-semibold">FeedMe</span>
        <ThemeToggle />
      </header>
      <main className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
            웹 페이지를 Markdown으로
          </h1>
          <p className="text-muted-foreground">
            URL을 붙여넣으면 본문만 Markdown으로 뽑아 ChatGPT나 Claude에 바로
            넘길 수 있습니다.
          </p>
        </div>
        <Converter />
      </main>
    </div>
  );
}
