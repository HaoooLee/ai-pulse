import { useState, useEffect } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useJsonData<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState(prev => ({ ...prev, loading: true, error: null }));

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch(err => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });

    return () => { cancelled = true; };
  }, [url]);

  return state;
}

export interface TweetData {
  id: string;
  content_summary: string;
  ai_analysis: string;
  topics: string[];
  tweet_url: string;
  posted_at: string;
  engagement: string;
  why_top?: string; // Only present in top_posts
}

export interface InfluencerData {
  name: string;
  handle: string;
  role: string;
  category: string;
  highlight: boolean;
  tweets: TweetData[];        // Alias for recent_posts (backward compat)
  recent_posts?: TweetData[]; // Latest 6 posts
  top_posts?: TweetData[];    // Top 3 most viral posts in last 6 months
  person_summary: string;
  fetched_at: string;
}

export interface CategoryData {
  name: string;
  icon: string;
  color: string;
  group: string;
}

export interface TweetsResponse {
  meta: {
    fetched_at: string;
    next_update: string;
    total_influencers: number;
    version: string;
  };
  categories: Record<string, CategoryData>;
  influencers: Record<string, InfluencerData>;
}

export interface AcademicProject {
  id: string;
  title: string;
  summary: string;
  ai_analysis: string;
  category: string;
  source_url: string;
  arxiv_url: string;
  github_url: string;
  shared_by: string;
  published_at: string;
  impact_level: string;
}

export interface AcademicResponse {
  meta: {
    fetched_at: string;
    total_projects: number;
  };
  projects: AcademicProject[];
}

export interface TrendingTopic {
  topic: string;
  description: string;
  related_people: string[];
}

export interface KeyDevelopment {
  title: string;
  description: string;
  source_url: string;
}

export interface TrendingResponse {
  headline: string;
  summary: string;
  hot_topics: TrendingTopic[];
  key_developments: KeyDevelopment[];
  fetched_at: string;
}

export function useTweets() {
  return useJsonData<TweetsResponse>('/data/tweets.json');
}

export function useAcademic() {
  return useJsonData<AcademicResponse>('/data/academic.json');
}

export function useTrending() {
  return useJsonData<TrendingResponse>('/data/trending.json');
}
