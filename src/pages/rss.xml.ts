import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '../config/site.config';

export async function GET(context: any) {
  const posts = await getCollection('blog', ({ data }) => {
    return data.draft !== true;
  });

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
    })),
    customData: `<language>${siteConfig.locale}</language>`,
  });
}
