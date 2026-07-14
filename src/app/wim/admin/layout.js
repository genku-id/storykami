import '../wim.css';

export const metadata = {
  title: 'Admin WIM - StoryKami',
  description: 'Admin Portal Wedding Invitation Manager',
};

export default function AdminLayout({ children }) {
  return (
    <div className="wim-app">
      {children}
    </div>
  );
}
