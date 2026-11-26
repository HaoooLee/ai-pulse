/**
 * Login Page - Editorial Warmth Style
 * Username + Password authentication
 */
import { Sparkles, Zap, BookOpen, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';

export default function Login() {
  const [, navigate] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (res.ok) {
        // Redirect to home or return path
        const returnPath = new URLSearchParams(window.location.search).get('return') || '/';
        window.location.href = returnPath;
      } else {
        const data = await res.json();
        setError(data.error || '用户名或密码错误');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-orange">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/8 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                AI Pulse
              </h1>
              <p className="text-xs text-white/70 tracking-widest uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                前沿资讯聚合
              </p>
            </div>
          </div>

          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            追踪AI领域<br />
            <span className="text-white/90">最前沿的声音</span>
          </h2>

          <p className="text-base text-white/80 leading-relaxed mb-10 max-w-md">
            聚合40+位AI领域顶尖人物的推特动态，通过Grok AI深度解读，每12小时自动更新。
          </p>

          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">大V动态追踪</p>
                <p className="text-xs text-white/60">覆盖OpenAI、DeepMind、Anthropic等顶尖团队</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">学术前沿速递</p>
                <p className="text-xs text-white/60">最新AI论文、开源项目深度解读</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">个人收藏夹</p>
                <p className="text-xs text-white/60">收藏感兴趣的内容，构建个人AI知识库</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                AI Pulse
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                前沿资讯聚合
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            欢迎回来
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            输入账号和密码，访问AI前沿资讯
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-foreground">
                用户名
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 bg-background border-border/60 focus:border-brand-orange focus:ring-brand-orange/20"
                autoComplete="username"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                密码
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10 bg-background border-border/60 focus:border-brand-orange focus:ring-brand-orange/20"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-brand-orange hover:bg-brand-orange-dark text-white font-medium text-sm rounded-lg transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </Button>
          </form>

          {/* Decorative footer */}
          <div className="mt-16 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center" style={{ fontFamily: 'var(--font-mono)' }}>
              Powered by Grok AI · 每12小时自动更新
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
