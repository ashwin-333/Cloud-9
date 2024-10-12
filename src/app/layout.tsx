import './globals.css';
import { AuthProvider } from '../lib/authContext';

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <title>welcome to cloud 9!</title>
      </head>
      <body className="body-class">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
};

export default RootLayout;
