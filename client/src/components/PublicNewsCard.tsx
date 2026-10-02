import { ExternalLink, Clock } from 'lucide-react';
import type { NewsItem, NewsInfluencer } from '@/hooks/useData';
import { formatDate } from '@/lib/utils';

export default function PublicNewsCard({ item, people }: { item: NewsItem; people: NewsInfluencer[] }) {
  const related = people.filter(person => item.related_handles.includes(person.handle));
  return (
    <article className="bg-card rounded-lg border border-border/50 p-5 card-hover">
      <p className="text-xs text-muted-foreground mb-2">{item.source_name}{item.author ? ` · ${item.author}` : ''}</p>
      <h3 className="text-base font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>{item.title}</h3>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{item.summary}</p>
      <div className="accent-line mb-4"><p className="text-sm leading-relaxed">{item.analysis}</p></div>
      <div className="flex flex-wrap gap-1.5 mb-3">{item.topics.map(topic => <span key={topic} className="tag-pill">{topic}</span>)}</div>
      {related.length > 0 && <p className="text-xs text-muted-foreground mb-3">原文相关人物：{related.map(person => person.name).join('、')}</p>}
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(item.published_at)}</span>
        <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-brand-orange">
          <ExternalLink className="w-3 h-3" />原始来源
        </a>
      </div>
    </article>
  );
}
