import "./globals.css";

export const metadata = {
  title: "StoryKami | Undangan Digital Premium",
  description: "Buat undangan digital elegan, cepat, dan terjangkau. Pesan sekarang untuk momen tak terlupakan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
