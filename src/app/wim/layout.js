import './wim.css';

export const metadata = {
  title: 'WIM - StoryKami',
  description: 'Wedding Invitation Manager',
};

export default function WimLayout({ children }) {
  return (
    <div className="wim-app">
      {children}
    </div>
  );
}
