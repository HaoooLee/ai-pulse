/*
 * Design: Editorial Warmth
 * Footer: Minimal footer with brand info and links
 */
const LOGO_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663393655905/WLAVeVPYGCycWsT7vD3Ng4/logo-icon-TwHKjaXnnFpF9t2eASLKRp.webp';

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-brand-cream-dark/50 mt-16">
      <div className="container py-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="AI Pulse" className="w-6 h-6" />
              <span className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                AI Pulse
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              聚合AI领域顶尖人物的推特动态和学术前沿，通过AI深度解读，为你呈现高信噪比的每日资讯。
            </p>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-2 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
            <span>数据来源：X / Twitter</span>
            <span>AI解读：Grok by xAI</span>
            <span>更新频率：每12小时</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} AI Pulse. 数据由Grok API提供，仅供信息参考。
          </p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
            Powered by xAI Grok
          </p>
        </div>
      </div>
    </footer>
  );
}
