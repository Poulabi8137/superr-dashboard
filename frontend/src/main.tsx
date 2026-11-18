import ReactDOM from "react-dom/client";
import App from "./App";
import { loadStage4 } from "./stage4";
import "./styles.css";
const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<main aria-live="polite">Loading Stage 4 records…</main>);
loadStage4()
  .then(() => root.render(<App />))
  .catch(() =>
    root.render(
      <main>
        <h1>Stage 4 data unavailable</h1>
        <p>The five exports could not be loaded together.</p>
        <button onClick={() => location.reload()}>Retry</button>
      </main>,
    ),
  );
