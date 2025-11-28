export interface PostMetadata {
  title: string;
  date: string;
  excerpt: string;
  category?: string;
  tags?: string[];
  slug: string;
  author?: string;
  image?: string;
}

export interface Post extends PostMetadata {
  htmlContent: string;
}

export interface ComponentMarker {
  name: string;
  props?: Record<string, unknown>;
}
