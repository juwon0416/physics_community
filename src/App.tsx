import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
// Import placeholders for now, will replace as I build them
import { TimelinePage } from './pages/TimelinePage';
import { TopicPage } from './pages/TopicPage';
import { SectionPage } from './pages/SectionPage';
import { GraphOverviewPage } from './pages/GraphOverviewPage';

function App() {
  console.log('App Mounted'); // Debug logic
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="graph" element={<GraphOverviewPage />} />
        <Route path="field/:fieldSlug" element={<TimelinePage />} />
        <Route path="topic/:topicSlug" element={<TopicPage />} />
        <Route path="topic/:topicSlug/section/:sectionId" element={<SectionPage />} />
        <Route path="*" element={<div className="p-8 text-center text-muted-foreground">Page Not Found</div>} />
      </Route>
    </Routes>
  );
}

export default App;
