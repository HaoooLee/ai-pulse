import { useState } from 'react';
import { useNews } from '@/hooks/useData';
import PublicNewsCard from '@/components/PublicNewsCard';
import { cn } from '@/lib/utils';
import { Search, Users, ExternalLink } from 'lucide-react';

export default function Voices() {
  const { data, loading, error } = useNews();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const query = searchQuery.trim().toLowerCase();
  const people = (data?.influencers || []).filter(person =>
    (selectedCategory === 'all' || person.category === selectedCategory) &&
    (!query || [person.name, person.handle, person.role].some(value => value.toLowerCase().includes(query)))
  );

  if (loading) return <div className="container py-10 text-muted-foreground">正在加载人物信源...</div>;
  if (error || !data) return <div className="container py-10 text-muted-foreground" role="alert">人物信源暂时无法加载，请稍后重试。</div>;

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 text-brand-orange mb-2"><Users className="w-4 h-4" /><span className="text-xs">人物信源</span></div>
      <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>大模型与 AI Infra 人物</h1>
      <p className="text-sm text-muted-foreground mb-6">关注 {data.influencers.length} 位研究者与行业领袖。下方资讯仅关联原文明确提及的人物，不代表其个人观点。</p>
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input aria-label="搜索人物" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="搜索姓名、账号或研究方向..." className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border/60 rounded-md" />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-8">
        {[['all', '全部'], ...Object.entries(data.categories).map(([key, value]) => [key, value.name])].map(([key, label]) => (
          <button key={key} onClick={() => setSelectedCategory(key)} className={cn('px-3 py-1.5 text-xs rounded-md border', selectedCategory === key ? 'bg-brand-orange text-white border-brand-orange' : 'bg-card border-border/60 text-muted-foreground')}>{label}</button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {people.map(person => {
          const items = data.items.filter(item => item.related_handles.includes(person.handle));
          return (
            <section key={person.handle} className="rounded-xl border border-border/50 bg-card/50 p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="font-semibold">{person.name}</h2>
                <a href={`https://x.com/${person.handle}`} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-orange flex items-center gap-1">@{person.handle}<ExternalLink className="w-3 h-3" /></a>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{person.role}</p>
              {items.length ? <div className="space-y-3">{items.map(item => <PublicNewsCard key={item.id} item={item} people={data.influencers} />)}</div> : <p className="text-xs text-muted-foreground">当前公开资讯尚未提及此人物。</p>}
            </section>
          );
        })}
      </div>
      {!people.length && <p className="text-center py-10 text-muted-foreground">没有找到匹配的人物。</p>}
    </div>
  );
}
