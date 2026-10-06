export type Artist = {
  id: string;
  name: string;
  username: string;
  genre: string;
  rating: number;
  reviews: number;
  imageUrl: string;
};

export const featuredArtists: Artist[] = [
  {
    id: "marina-luz",
    name: "Marina Luz",
    username: "marinaluz",
    genre: "MPB",
    rating: 4.9,
    reviews: 48,
    imageUrl: "https://images.unsplash.com/photo-1767755254671-ea10b27552f2?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "caio-banda",
    name: "Caio & Banda",
    username: "caioebanda",
    genre: "Rock",
    rating: 4.8,
    reviews: 36,
    imageUrl: "https://images.unsplash.com/photo-1767683434124-389575e88291?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "duda-alves",
    name: "Duda Alves",
    username: "dudaalves",
    genre: "Jazz",
    rating: 5,
    reviews: 52,
    imageUrl: "https://images.unsplash.com/photo-1586559609824-5b7d96ee2124?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "dj-aurora",
    name: "DJ Aurora",
    username: "djaurora",
    genre: "Eletrônica",
    rating: 4.9,
    reviews: 41,
    imageUrl: "https://images.unsplash.com/photo-1760126096208-2addef9d6486?auto=format&fit=crop&w=700&q=85",
  },
];
