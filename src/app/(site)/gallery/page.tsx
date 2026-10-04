import { client } from "@/sanity/lib/client";
import imageUrlBuilder from "@sanity/image-url";

const builder = imageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

type GalleryItem = {
  _id: string;
  title: string;
  year: number;
  description?: string;
  category?: string;
  image: any;
};

async function getGalleryItems(): Promise<GalleryItem[]> {
  return client.fetch(
    `*[_type == "galleryItem"] | order(year desc) {
      _id, title, year, description, category, image
    }`
  );
}

export default async function GalleryPage() {
  const items = await getGalleryItems();

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="mb-10 text-center text-3xl font-bold text-racing-yellow sm:text-4xl">
          Gallery
        </h1>

        {items.length === 0 ? (
          <p className="text-center text-white/60">
            Nessuna foto ancora caricata.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item._id} className="overflow-hidden rounded-lg bg-carbon-800">
                <img
                  src={urlFor(item.image).width(600).height(450).url()}
                  alt={item.image?.alt || item.title}
                  className="h-64 w-full object-cover"
                />
                <div className="p-4">
                  <p className="text-sm text-racing-yellow">{item.year}</p>
                  <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                  {item.description && (
                    <p className="mt-2 text-sm text-white/70">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}