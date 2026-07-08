import type { RfqSubmission } from "@/lib/rfq-store";

const telegramApiBase = "https://api.telegram.org";

function cleanEnv(value?: string) {
  return value?.trim().replace(/^["']|["']$/g, "");
}

function getTelegramConfig() {
  const botToken = cleanEnv(process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN);
  const chatId = cleanEnv(process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHATID);
  if (!botToken || !chatId) return null;
  return { botToken, chatId };
}

function formatTelegramMessage(submission: RfqSubmission) {
  const lines = [
    "마하렉스 홈페이지 견적문의가 접수되었습니다.",
    "",
    `회사명: ${submission.company}`,
    `담당자: ${submission.name}`,
    `연락처: ${submission.phone}`,
    `이메일: ${submission.email || "-"}`,
    `관심 제품: ${submission.product || "-"}`,
    "",
    "요청 사항:",
    submission.message,
    "",
    `접수 시간: ${new Date(submission.createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`
  ];

  return lines.join("\n");
}

export async function notifyTelegramRfq(submission: RfqSubmission) {
  const config = getTelegramConfig();
  if (!config) return { skipped: true };

  const response = await fetch(`${telegramApiBase}/bot${config.botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: config.chatId,
      text: formatTelegramMessage(submission),
      disable_web_page_preview: true
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Telegram notification failed: ${response.status} ${errorText}`);
  }

  return { skipped: false };
}
