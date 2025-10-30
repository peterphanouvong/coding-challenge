import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Practitioner {
  id: string;
  email: string;
}

export default function ConfigurePage() {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [emailInput, setEmailInput] = useState("");

  const handleAddPractitioner = () => {
    const email = emailInput.trim();
    if (!email) return;

    const newPractitioner: Practitioner = {
      id: Math.random().toString(36).slice(2),
      email,
    };

    setPractitioners((prev) => [...prev, newPractitioner]);
    setEmailInput("");
  };

  const handleRemovePractitioner = (id: string) => {
    setPractitioners((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="configure-page">
      <h1>Configuration</h1>

      <section>
        <h2>Practitioners</h2>

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <Input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Enter practitioner email"
            onKeyDown={(e) => e.key === "Enter" && handleAddPractitioner()}
          />
          <Button variant={"secondary"} onClick={handleAddPractitioner}>
            Add Practitioner
          </Button>
        </div>

        {practitioners.length === 0 ? (
          <p style={{ color: "#666" }}>No practitioners added yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {practitioners.map((practitioner) => (
              <li
                key={practitioner.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  marginBottom: "8px",
                }}
              >
                <span>{practitioner.email}</span>
                <Button
                  onClick={() => handleRemovePractitioner(practitioner.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
