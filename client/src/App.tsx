import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import NewDiagnosis from './pages/NewDiagnosis';
import History from './pages/History';
import DiagnosisReport from './pages/DiagnosisReport';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Sidebar Navigation */}
        <div className="no-print">
          <Sidebar />
        </div>
        
        {/* Main Content Area */}
        <div style={styles.mainLayout}>
          <div className="no-print">
            <Navbar title="NEUMO-AI: Detección Asistida de Neumonía" />
          </div>
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<NewDiagnosis />} />
              <Route path="/history" element={<History />} />
              <Route path="/report/:id" element={<DiagnosisReport />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

const styles: Record<string, React.CSSProperties> = {
  mainLayout: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: '100vh',
    overflowY: 'auto',
  }
};

export default App;
