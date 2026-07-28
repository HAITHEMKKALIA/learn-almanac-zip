import { Helmet } from "react-helmet-async";

const SITE_URL = "https://hkdeutschmeister.lovable.app";

interface PageSeoProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
}

/** Per-route <head> tags: title, meta description, canonical, og:*, twitter:*. */
export function PageSeo({ title, description, path, image, type = "website" }: PageSeoProps) {
  const url = `${SITE_URL}${path}`;
  const img = image ?? `${SITE_URL}/icon-512.png`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
}
