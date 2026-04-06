import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DocLayout from './components/DocLayout';
import GettingStarted from './pages/GettingStarted';
import Colors from './pages/foundations/Colors';
import Typography from './pages/foundations/Typography';
import Spacing from './pages/foundations/Spacing';
import Shadows from './pages/foundations/Shadows';
import Animations from './pages/foundations/Animations';
import ButtonDocs from './pages/components/ButtonDocs';
import InputDocs from './pages/components/InputDocs';
import BadgeDocs from './pages/components/BadgeDocs';
import ModalDocs from './pages/components/ModalDocs';
import ToastDocs from './pages/components/ToastDocs';
import LoadingDocs from './pages/components/LoadingDocs';
import LayoutPatterns from './pages/patterns/LayoutPatterns';
import MigrationGuide from './pages/resources/MigrationGuide';
import Changelog from './pages/resources/Changelog';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DocLayout />}>
          <Route index element={<Navigate to="/getting-started" replace />} />
          <Route path="getting-started" element={<GettingStarted />} />
          
          {/* Foundations */}
          <Route path="foundations/colors" element={<Colors />} />
          <Route path="foundations/typography" element={<Typography />} />
          <Route path="foundations/spacing" element={<Spacing />} />
          <Route path="foundations/shadows" element={<Shadows />} />
          <Route path="foundations/animations" element={<Animations />} />
          
          {/* Components */}
          <Route path="components/button" element={<ButtonDocs />} />
          <Route path="components/input" element={<InputDocs />} />
          <Route path="components/badge" element={<BadgeDocs />} />
          <Route path="components/modal" element={<ModalDocs />} />
          <Route path="components/toast" element={<ToastDocs />} />
          <Route path="components/loading" element={<LoadingDocs />} />
          
          {/* Patterns */}
          <Route path="patterns/layout" element={<LayoutPatterns />} />
          
          {/* Resources */}
          <Route path="resources/migration" element={<MigrationGuide />} />
          <Route path="resources/changelog" element={<Changelog />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
