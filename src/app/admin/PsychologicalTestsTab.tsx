"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { PsychologicalTest } from "../../types";

export default function PsychologicalTestsTab() {
  const [tests, setTests] = useState<PsychologicalTest[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulário para novo teste
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [initialStock, setInitialStock] = useState("");
  const [minStock, setMinStock] = useState("");

  // Estado para os inputs de Uso e Compra
  const [useInputs, setUseInputs] = useState<Record<string, string>>({});
  const [buyInputs, setBuyInputs] = useState<Record<string, string>>({});

  const fetchTests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("psychological_tests")
      .select("*")
      .order("name");

    if (error) {
      console.error("Erro ao buscar testes:", error);
    } else {
      setTests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const { error } = await supabase.from("psychological_tests").insert([
      {
        name,
        description,
        stock: parseInt(initialStock) || 0,
        min_stock: parseInt(minStock) || 0,
      }
    ]);

    if (error) {
      alert("Erro ao cadastrar teste.");
      console.error(error);
    } else {
      setName("");
      setDescription("");
      setInitialStock("");
      setMinStock("");
      fetchTests();
    }
  };

  const handleUpdateStock = async (id: string, currentStock: number, isAddition: boolean) => {
    const inputVal = isAddition ? buyInputs[id] : useInputs[id];
    const amount = parseInt(inputVal) || 0;
    
    if (amount <= 0) return;

    const newStock = isAddition ? currentStock + amount : currentStock - amount;

    if (newStock < 0) {
      alert("O estoque não pode ficar negativo.");
      return;
    }

    const { error } = await supabase
      .from("psychological_tests")
      .update({ stock: newStock })
      .eq("id", id);

    if (error) {
      alert("Erro ao atualizar o estoque.");
      console.error(error);
    } else {
      if (isAddition) {
        setBuyInputs(prev => ({ ...prev, [id]: "" }));
      } else {
        setUseInputs(prev => ({ ...prev, [id]: "" }));
      }
      fetchTests();
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este teste?")) return;

    const { error } = await supabase
      .from("psychological_tests")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erro ao excluir teste.");
      console.error(error);
    } else {
      fetchTests();
    }
  };

  return (
    <div className="admin-content-section animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 className="admin-section-title">📦 Estoque de Testes Psicológicos</h2>
      </div>

      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        
        {/* Tabela de Estoque */}
        <div className="admin-card" style={{ flex: 2, minWidth: "600px" }}>
          <h3 className="admin-card-title">Estoque Atual</h3>
          {loading ? (
            <p>Carregando...</p>
          ) : tests.length === 0 ? (
            <p className="empty-state">Nenhum teste cadastrado.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="responsive-table" style={{ minWidth: "800px" }}>
                <thead>
                  <tr>
                    <th>Nome do Teste</th>
                    <th>Estoque Mín.</th>
                    <th>Em Estoque</th>
                    <th>Registrar Uso (Saída)</th>
                    <th>Registrar Compra (Entrada)</th>
                    <th style={{ textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map(test => {
                    const isLowStock = test.stock <= test.min_stock;
                    
                    return (
                      <tr key={test.id} style={isLowStock ? { backgroundColor: "var(--danger-light)" } : {}}>
                        <td style={{ fontWeight: 600 }}>
                          {test.name}
                          {test.description && <div style={{ fontSize: "0.8rem", color: "var(--text-light)", fontWeight: "normal" }}>{test.description}</div>}
                        </td>
                        <td>{test.min_stock}</td>
                        <td>
                          <span style={{ 
                            fontWeight: "bold", 
                            color: isLowStock ? "var(--danger)" : "var(--primary)" 
                          }}>
                            {test.stock}
                          </span>
                          {isLowStock && (
                            <span style={{ display: "block", fontSize: "0.75rem", color: "var(--danger)" }}>
                              ⚠️ Estoque Mínimo
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input 
                              type="number" 
                              className="input" 
                              style={{ width: "70px", padding: "0.4rem" }} 
                              placeholder="Qtd" 
                              value={useInputs[test.id] || ""}
                              onChange={e => setUseInputs(prev => ({ ...prev, [test.id]: e.target.value }))}
                            />
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: "0.4rem 0.8rem" }}
                              onClick={() => handleUpdateStock(test.id, test.stock, false)}
                            >
                              Usar
                            </button>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input 
                              type="number" 
                              className="input" 
                              style={{ width: "70px", padding: "0.4rem" }} 
                              placeholder="Qtd" 
                              value={buyInputs[test.id] || ""}
                              onChange={e => setBuyInputs(prev => ({ ...prev, [test.id]: e.target.value }))}
                            />
                            <button 
                              className="btn" 
                              style={{ padding: "0.4rem 0.8rem" }}
                              onClick={() => handleUpdateStock(test.id, test.stock, true)}
                            >
                              Comprar
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            onClick={() => handleDeleteTest(test.id)} 
                            style={{ 
                              padding: "0.4rem 0.8rem", 
                              backgroundColor: "var(--danger-light)", 
                              color: "var(--danger)", 
                              border: "none", 
                              borderRadius: "var(--radius-sm)", 
                              fontSize: "0.8rem", 
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formulário de Novo Teste */}
        <div className="admin-card" style={{ flex: 1, minWidth: "300px" }}>
          <h3 className="admin-card-title">Cadastrar Novo Teste</h3>
          <form onSubmit={handleAddTest} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label">Nome do Teste / Protocolo</label>
              <input 
                className="input" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="Ex: Palográfico" 
              />
            </div>
            
            <div>
              <label className="label">Descrição (Opcional)</label>
              <input 
                className="input" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Detalhes adicionais..." 
              />
            </div>
            
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label className="label">Estoque Inicial</label>
                <input 
                  type="number" 
                  className="input" 
                  value={initialStock} 
                  onChange={e => setInitialStock(e.target.value)} 
                  placeholder="0" 
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label className="label">Aviso (Estoque Mín.)</label>
                <input 
                  type="number" 
                  className="input" 
                  value={minStock} 
                  onChange={e => setMinStock(e.target.value)} 
                  placeholder="0" 
                />
              </div>
            </div>
            
            <button type="submit" className="btn" style={{ marginTop: "0.5rem" }}>
              Cadastrar Teste
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
