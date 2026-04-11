import { useState, useEffect, useRef, useCallback } from "react";

const API = "https://api-mock-cesga.onrender.com";

const SAMPLE_FASTA = `>sp|P0CG47|UBQ_HUMAN Ubiquitin OS=Homo sapiens
MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG`;

export default function App() {
  const [tab, setTab] = useState("submit");
  const [fasta, setFasta] = useState(SAMPLE_FASTA);
  const [gpus, setGpus] = useState(1);
  const [cpus, setCpus] = useState(8);
  const [memory, setMemory] = useState(32);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [outputs, setOutputs] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState([]);
  const [notification, setNotification] = useState(null);
  const pollingRef = useRef();

  const showNotification = (msg, type = "info") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const pollStatus = useCallback(async (id) => {
    try {
      const r = await fetch(`${API}/jobs/${id}/status`);
      const data = await r.json();
      setStatus(data.status);
      if (data.status === "COMPLETED") {
        clearInterval(pollingRef.current);
        const outR = await fetch(`${API}/jobs/${id}/outputs`);
        const outData = await outR.json();
        setOutputs(outData);
        setTab("results");
        showNotification("Predicción completada!", "success");
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status: "COMPLETED" } : j));
      } else if (data.status === "FAILED") {
        clearInterval(pollingRef.current);
        showNotification("El job falló.", "error");
      }
    } catch (e) {}
  }, []);

  const submitJob = async () => {
    setSubmitting(true);
    setError("");
    try {
      const r = await fetch(`${API}/jobs/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fasta_sequence: fasta,
          fasta_filename: "sequence.fasta",
          gpus: parseInt(gpus),
          cpus: parseInt(cpus),
          memory_gb: parseFloat(memory),
          max_runtime_seconds: 3600,
        }),
      });
      if (!r.ok) throw new Error("Error al enviar el job");
      const data = await r.json();
      setJobId(data.job_id);
      setStatus("PENDING");
      setJobs(prev => [{ id: data.job_id, status: "PENDING", time: new Date().toLocaleTimeString() }, ...prev]);
      setTab("status");
      showNotification("Job enviado al CESGA!");
      pollingRef.current = setInterval(() => pollStatus(data.job_id), 2000);
    } catch (e) {
      setError(e.message);
    }
    setSubmitting(false);
  };

  const tabStyle = (t) => ({
    padding: "8px 16px", fontSize: 13,
    fontWeight: tab === t ? 500 : 400,
    color: tab === t ? "#000" : "#666",
    borderBottom: tab === t ? "2px solid #000" : "2px solid transparent",
    background: "none", border: "none",
    borderBottom: tab === t ? "2px solid #000" : "2px solid transparent",
    cursor: "pointer",
  });

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto", padding: "1rem" }}>
      {notification && (
        <div style={{
          position: "fixed", top: 16, right: 16, zIndex: 999, maxWidth: 320,
          background: notification.type === "success" ? "#E1F5EE" : notification.type === "error" ? "#FCEBEB" : "#fff",
          border: "1px solid #ccc", borderRadius: 10, padding: "10px 16px", fontSize: 13,
        }}>
          {notification.msg}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 22, fontWeight: 500 }}>LocalFold</span>
        <span style={{ fontSize: 12, color: "#666", marginLeft: 10, background: "#f0f0f0", padding: "2px 8px", borderRadius: 20 }}>CESGA · AlphaFold2</span>
        <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>Portal de predicción de estructuras proteicas · IMPACTHON 2026</div>
      </div>

      <div style={{ borderBottom: "1px solid #eee", display: "flex", marginBottom: 20 }}>
        {[["submit","Nueva predicción"],["status","Estado"],["results","Resultados"],["history","Historial"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={tabStyle(key)}>{label}</button>
        ))}
      </div>

      {tab === "submit" && (
        <div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Secuencia FASTA</div>
          <textarea value={fasta} onChange={e => setFasta(e.target.value)} rows={6}
            style={{ width: "100%", fontFamily: "monospace", fontSize: 12, boxSizing: "border-box" }} />
          {error && <div style={{ color: "red", fontSize: 12, margin: "8px 0" }}>{error}</div>}
          <div style={{ display: "flex", gap: 12, margin: "12px 0" }}>
            {[["GPUs (0-4)", gpus, setGpus, 0, 4], ["CPUs (1-64)", cpus, setCpus, 1, 64], ["RAM GB", memory, setMemory, 4, 256]].map(([label, val, set, min, max]) => (
              <div key={label} style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>{label}: {val}</div>
                <input type="range" min={min} max={max} value={val} onChange={e => set(Number(e.target.value))} style={{ width: "100%" }} />
              </div>
            ))}
          </div>
          <button onClick={submitJob} disabled={submitting || !fasta.trim().startsWith(">")}
            style={{ padding: "10px 24px", fontSize: 14 }}>
            {submitting ? "Enviando..." : "Enviar al CESGA →"}
          </button>
        </div>
      )}

      {tab === "status" && (
        <div>
          {!jobId ? <div style={{ color: "#666" }}>No has enviado ningún job todavía.</div> : (
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 12, marginBottom: 12 }}>Job: {jobId}</div>
              <div style={{ fontSize: 20, fontWeight: 500, color: status === "COMPLETED" ? "green" : status === "FAILED" ? "red" : "orange" }}>
                {status || "—"}
              </div>
              {status === "COMPLETED" && (
                <button onClick={() => setTab("results")} style={{ marginTop: 12, padding: "8px 20px" }}>Ver resultados →</button>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "results" && (
        <div>
          {!outputs ? <div style={{ color: "#666" }}>No hay resultados disponibles aún.</div> : (
            <div>
              {outputs.protein_metadata && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 18, fontWeight: 500 }}>{outputs.protein_metadata.protein_name}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    UniProt: {outputs.protein_metadata.uniprot_id} · PDB: {outputs.protein_metadata.pdb_id} · {outputs.protein_metadata.organism}
                  </div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                {[
                  ["pLDDT medio", outputs.structural_data?.confidence?.plddt_mean?.toFixed(1) + "/100"],
                  ["PAE medio", outputs.structural_data?.confidence?.mean_pae?.toFixed(2) + " Å"],
                  ["Solubilidad", outputs.biological_data?.solubility_score?.toFixed(0) + "/100"],
                  ["Inestabilidad", outputs.biological_data?.instability_index?.toFixed(1)],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: "#f5f5f5", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color: "#666" }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => {
                const blob = new Blob([outputs.structural_data.pdb_file], { type: "text/plain" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                a.download = "structure.pdb"; a.click();
              }} style={{ padding: "8px 20px", fontSize: 13 }}>Descargar PDB</button>
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div>
          {jobs.length === 0 ? <div style={{ color: "#666" }}>No has enviado ningún job todavía.</div> : (
            jobs.map(j => (
              <div key={j.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", border: "1px solid #eee", borderRadius: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 12 }}>{j.id}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>{j.time}</div>
                </div>
                <span style={{ fontSize: 11, color: j.status === "COMPLETED" ? "green" : j.status === "FAILED" ? "red" : "orange" }}>{j.status}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
