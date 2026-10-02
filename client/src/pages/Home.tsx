/*
 * Design: Editorial Warmth - Home Page
 * Hero section with trending summary, featured voices, and latest highlights
 * Color: Cream background, orange accents, warm editorial feel
 */
import { useAuth } from '@/_core/hooks/useAuth';
import { Link } from 'wouter';
import { useTweets, useTrending, useAcademic, useNews } from '@/hooks/useData';
import { formatFullDate } from '@/lib/utils';
import TweetCard from '@/components/TweetCard';
import AcademicCard from '@/components/AcademicCard';
import PublicNewsCard from '@/components/PublicNewsCard';
import { ArrowRight, Zap, BookOpen, TrendingUp, Clock, Sparkles, ChevronRight } from 'lucide-react';

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663393655905/WLAVeVPYGCycWsT7vD3Ng4/hero-bg-8Mq7TgD88UihVYytSHUPh6.webp';

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const { data: tweets, loading: tweetsLoading } = useTweets();
  const { data: trending, loading: trendingLoading } = useTrending();
  const { data: academic, loading: academicLoading } = useAcademic();
  const { data: news, loading: newsLoading, error: newsError } = useNews();

  // Get highlight influencers' latest tweets
  const highlightTweets = tweets
    ? Object.values(tweets.influencers)
        .filter(inf => inf.highlight && inf.tweets.length > 0)
        .flatMap(inf => inf.tweets.slice(0, 1).map(t => ({ tweet: t, name: inf.name, handle: inf.handle })))
        .slice(0, 4)
    : [];

  const latestProjects = academic?.projects.slice(0, 3) || [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${HERO_BG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />

        <div className="container relative pt-12 pb-16 md:pt-16 md:pb-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-brand-orange" />
              <span className="text-xs font-medium text-brand-orange uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
                AI前沿资讯聚合
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              追踪AI领域
              <span className="text-brand-orange">最前沿</span>
              的声音
            </h1>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mb-6">
              汇集大模型与 AI 基础设施的公开资讯，通过 Grok 生成中文摘要与分析，关注研究方向、模型能力和算力投入。
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link href="/voices" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-orange text-white rounded-md text-sm font-medium hover:bg-brand-orange-dark transition-colors shadow-warm">
                <Zap className="w-4 h-4" />
                人物信源
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/academic" className="inline-flex items-center gap-2 px-5 py-2.5 bg-card border border-border/60 text-foreground rounded-md text-sm font-medium hover:border-brand-orange/40 hover:text-brand-orange transition-colors">
                <BookOpen className="w-4 h-4" />
                学术前沿
              </Link>
            </div>

            {/* Update status */}
            {news?.meta && (
              <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  上次更新: {formatFullDate(news.meta.fetched_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  关注 {news.meta.total_influencers} 位人物信源
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container py-8">
        <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>大模型与 AI Infra 资讯</h2>
        <p className="text-sm text-muted-foreground mb-6">官方公开来源 · 中文摘要与分析</p>
        {newsLoading ? <p className="text-sm text-muted-foreground">正在加载资讯...</p> : newsError ? (
          <p role="alert" className="text-sm text-muted-foreground">资讯暂时无法加载，请稍后重试。</p>
        ) : news && news.items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">{news.items.map(item => <PublicNewsCard key={item.id} item={item} people={news.influencers} />)}</div>
        ) : <p className="text-sm text-muted-foreground">暂无已发布资讯。</p>}
      </section>

      {/* Trending Section */}
      {!trendingLoading && trending && trending.key_developments.length > 0 && (
        <section className="container py-10">
          <div className="bg-card rounded-xl border border-border/50 shadow-warm overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-brand-orange" />
                <span className="text-xs font-medium text-brand-orange uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
                  今日热点
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                {trending.headline}
              </h2>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
                {trending.summary}
              </p>

              {/* Key Developments */}
              {trending.key_developments.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                  {trending.key_developments.map((dev, i) => (
                    <div key={i} className="p-4 rounded-lg bg-secondary/40 border border-border/30">
                      <h4 className="text-sm font-semibold text-foreground mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                        {dev.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {dev.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Hot Topics */}
              {trending.hot_topics.length > 0 && (
                <div className="mt-5 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground mr-1">热门话题:</span>
                  {trending.hot_topics.map((topic, i) => (
                    <span key={i} className="tag-pill">{topic.topic}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Featured Voices */}
      {(tweetsLoading || highlightTweets.length > 0) && <section className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-brand-orange" />
              <span className="text-xs font-medium text-brand-orange uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
                Top Voices
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              大V最新动态
            </h2>
          </div>
          <Link href="/voices" className="flex items-center gap-1 text-sm text-brand-orange hover:text-brand-orange-dark transition-colors font-medium">
            查看全部
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {tweetsLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-lg border border-border/50 p-5 animate-pulse">
                <div className="h-4 bg-secondary rounded w-1/3 mb-3" />
                <div className="h-3 bg-secondary rounded w-full mb-2" />
                <div className="h-3 bg-secondary rounded w-2/3 mb-4" />
                <div className="h-16 bg-secondary/60 rounded mb-3" />
                <div className="flex gap-2">
                  <div className="h-5 bg-secondary rounded-full w-16" />
                  <div className="h-5 bg-secondary rounded-full w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {highlightTweets.map(({ tweet, name, handle }) => (
              <TweetCard
                key={tweet.id}
                tweet={tweet}
                influencerName={name}
                influencerHandle={handle}
              />
            ))}
          </div>
        )}
      </section>}

      {/* Academic Highlights */}
      {(academicLoading || latestProjects.length > 0) && <section className="container py-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-brand-orange" />
              <span className="text-xs font-medium text-brand-orange uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
                Academic
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              学术前沿速递
            </h2>
          </div>
          <Link href="/academic" className="flex items-center gap-1 text-sm text-brand-orange hover:text-brand-orange-dark transition-colors font-medium">
            查看全部
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {academicLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-lg border border-border/50 p-5 animate-pulse">
                <div className="h-5 bg-secondary rounded-full w-20 mb-3" />
                <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                <div className="h-3 bg-secondary rounded w-full mb-4" />
                <div className="h-16 bg-secondary/60 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {latestProjects.map(project => (
              <AcademicCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>}
    </div>
  );
}
