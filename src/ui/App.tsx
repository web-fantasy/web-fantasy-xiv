import { LocationProvider, Router, Route } from 'preact-iso'
import { EngineProvider } from './engine-context'
import { MainMenu, EncounterListPage, JobPage, AboutPage } from './components/MainMenu'
import { GameView } from './components/GameView'

export function App() {
  return (
    <LocationProvider>
      <EngineProvider>
        <div
          id="ui-overlay"
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none', fontFamily: "'Segoe UI', sans-serif", color: '#fff',
          }}
        >
          <Router>
            <Route path="/" component={MainMenu} />
            <Route path="/encounters" component={EncounterListPage} />
            <Route path="/job" component={JobPage} />
            <Route path="/about" component={AboutPage} />
            <Route path="/encounter/:id" component={GameView} />
          </Router>
        </div>
      </EngineProvider>
    </LocationProvider>
  )
}
