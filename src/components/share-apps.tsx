/** One-tap share buttons for the most common messaging apps. */
export function ShareApps({ url, text }: { url: string; text: string }) {
  const msg = encodeURIComponent(`${text}\n${url}`);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  const apps = [
    { name: "WhatsApp", href: `https://wa.me/?text=${msg}` },
    { name: "LINE", href: `https://line.me/R/share?text=${msg}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
    { name: "Messenger", href: `fb-messenger://share/?link=${u}` },
    { name: "SMS", href: `sms:?&body=${msg}` },
    { name: "E-mail", href: `mailto:?body=${msg}` },
  ];
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {apps.map((a) => (
        <a
          key={a.name}
          href={a.href}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-border bg-surface px-2 py-2.5 text-center text-sm font-medium"
        >
          {a.name}
        </a>
      ))}
    </div>
  );
}
